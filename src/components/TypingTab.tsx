import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { proverbs } from '../data/phrases.ts';
import { useKeydown } from '../hooks/useKeydown.ts';
import { randomItem } from '../lib/platform.ts';
import { isNumber, useStoredState } from '../lib/storage.ts';
import { typingTable } from '../lib/tables.ts';
import { transliterate } from '../lib/translit.ts';

const BEST_KEY = 'translit:typing-best';
const BLOCKED_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
const CYRILLIC = /[а-яё]/i;

interface WordPart {
    token: string;
    start: number;
    space: boolean;
}

interface Caret {
    left: number;
    top: number;
    height: number;
}

interface Keystrokes {
    total: number;
    errors: number;
}

const makeTarget = (phrase: string) => transliterate(phrase.replace(/[—–]/g, '-'), typingTable);

// Делим текст на слова и пробелы, чтобы строки переносились по словам
function splitWords(text: string): WordPart[] {
    const parts: WordPart[] = [];
    let start = 0;
    for (const token of text.split(/( )/)) {
        if (!token) continue;
        parts.push({ token, start, space: token === ' ' });
        start += token.length;
    }
    return parts;
}

function formatTime(seconds: number): string {
    const s = Math.floor(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function TypingTab() {
    const [phrase, setPhrase] = useState(() => randomItem(proverbs));
    const [typed, setTyped] = useState('');
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [finishedAt, setFinishedAt] = useState<number | null>(null);
    const [keys, setKeys] = useState<Keystrokes>({ total: 0, errors: 0 });
    const [now, setNow] = useState(() => Date.now());
    const [focused, setFocused] = useState(false);
    const [wrongLayout, setWrongLayout] = useState(false);
    const [round, setRound] = useState(0);
    const [newBest, setNewBest] = useState(false);
    const [best, setBest] = useStoredState(BEST_KEY, 0, isNumber);

    const inputRef = useRef<HTMLInputElement>(null);
    const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const textRef = useRef<HTMLDivElement>(null);
    const [caret, setCaret] = useState<Caret | null>(null);

    const target = useMemo(() => makeTarget(phrase), [phrase]);
    const words = useMemo(() => splitWords(target), [target]);

    const finished = finishedAt !== null;
    const running = startedAt !== null && !finished;

    // Таймер: обновляем экран 5 раз в секунду, пока идёт попытка
    useEffect(() => {
        if (!running) return undefined;
        const id = setInterval(() => setNow(Date.now()), 200);
        return () => clearInterval(id);
    }, [running]);

    // Статистика
    const elapsed = startedAt !== null ? Math.max(0, (finishedAt ?? now) - startedAt) / 1000 : 0;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
        if (typed[i] === target[i]) correct++;
    }
    const wpm = elapsed > 1 ? Math.round(correct / 5 / (elapsed / 60)) : 0;
    const accuracy = keys.total ? Math.round(((keys.total - keys.errors) / keys.total) * 100) : 100;

    // Рекорд
    useEffect(() => {
        if (!finished) return;
        if (wpm > best) {
            setBest(wpm);
            setNewBest(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    const focusInput = useCallback(() => {
        requestAnimationFrame(() => inputRef.current?.focus());
    }, []);

    const reset = useCallback((nextPhrase?: string) => {
        if (nextPhrase) setPhrase(nextPhrase);
        setTyped('');
        setStartedAt(null);
        setFinishedAt(null);
        setKeys({ total: 0, errors: 0 });
        setWrongLayout(false);
        setNewBest(false);
        setRound((r) => r + 1);
        focusInput();
    }, [focusInput]);

    const next = useCallback(() => reset(randomItem(proverbs, phrase)), [reset, phrase]);
    const restart = useCallback(() => reset(), [reset]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        if (finished) return;

        let value = event.target.value;
        if (value.length > target.length) value = value.slice(0, target.length);

        if (value.length > typed.length) {
            const added = value.slice(typed.length);
            let errors = 0;
            for (let i = typed.length; i < value.length; i++) {
                if (value[i] !== target[i]) errors++;
            }
            setKeys((k) => ({ total: k.total + added.length, errors: k.errors + errors }));
            setWrongLayout(CYRILLIC.test(added));

            const time = Date.now();
            setNow(time);
            if (startedAt === null) setStartedAt(time);
            if (value.length === target.length) setFinishedAt(time);
        }

        setTyped(value);
    }

    useKeydown((event) => {
        const inGame = document.activeElement === inputRef.current;

        if (event.key === 'Tab' && (inGame || finished)) {
            event.preventDefault();
            next();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            restart();
        } else if (event.key === 'Enter' && finished && document.activeElement?.tagName !== 'BUTTON') {
            event.preventDefault();
            next();
        } else if (!inGame && !finished && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            // Любая буква сразу начинает игру, даже если поле не в фокусе
            const tag = document.activeElement?.tagName;
            if (tag !== 'INPUT' && tag !== 'TEXTAREA') inputRef.current?.focus();
        }
    });

    // Плавный курсор: двигаем его к текущей букве
    const placeCaret = useCallback(() => {
        const index = Math.min(typed.length, target.length - 1);
        const element = charRefs.current[index];
        if (!element) return;
        const atEnd = typed.length >= target.length;
        setCaret({
            left: element.offsetLeft + (atEnd ? element.offsetWidth : 0),
            top: element.offsetTop,
            height: element.offsetHeight,
        });
    }, [typed, target]);

    useLayoutEffect(placeCaret, [placeCaret, round]);

    // Текст может сдвинуться и без нажатий: страница расширяется при переходе
    // на вкладку, меняется размер окна, догружается шрифт. Следим за размером
    // текста и пересчитываем курсор, иначе он остаётся на старом месте.
    const placeCaretRef = useRef(placeCaret);
    placeCaretRef.current = placeCaret;

    useEffect(() => {
        const text = textRef.current;
        if (!text) return undefined;

        const update = () => placeCaretRef.current();
        const observer = new ResizeObserver(update);
        observer.observe(text);
        void document.fonts?.ready.then(update);
        return () => observer.disconnect();
    }, [round, finished]);

    function charClass(i: number): string {
        if (i >= typed.length) return 'char';
        return typed[i] === target[i] ? 'char ok' : 'char bad';
    }

    function setCharRef(index: number) {
        return (element: HTMLSpanElement | null) => {
            charRefs.current[index] = element;
        };
    }

    return (
        <div className="typing">
            {finished ? (
                <div className="typing-results" key={'results' + round}>
                    <div className="stat big">
                        <span className="stat-value">{wpm}</span>
                        <span className="stat-label">слов в минуту</span>
                    </div>
                    <div className="stat-row">
                        <div className="stat">
                            <span className="stat-value">{accuracy}%</span>
                            <span className="stat-label">точность</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{formatTime(elapsed)}</span>
                            <span className="stat-label">время</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{best}</span>
                            <span className="stat-label">рекорд</span>
                        </div>
                    </div>
                    {newBest && <p className="record">новый рекорд!</p>}
                    <div className="actions">
                        <button type="button" className="ghost done" onClick={next}>следующий</button>
                        <button type="button" className="ghost" onClick={restart}>ещё раз</button>
                    </div>
                </div>
            ) : (
                <div className="typing-game" onClick={() => inputRef.current?.focus()}>
                    <div className={'typing-content' + (focused ? '' : ' blurred')}>
                        <div className="typing-stats">
                            {running ? (
                                <>
                                    <span>{formatTime(elapsed)}</span>
                                    <span>{wpm} wpm</span>
                                    <span>{accuracy}%</span>
                                </>
                            ) : (
                                <span>{best > 0 ? `рекорд: ${best} wpm` : ''}</span>
                            )}
                        </div>

                        <div className="typing-box">
                            <input
                                ref={inputRef}
                                className="typing-input"
                                value={typed}
                                onChange={handleChange}
                                onKeyDown={(event) => {
                                    if (BLOCKED_KEYS.includes(event.key)) event.preventDefault();
                                }}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                aria-label="Поле для набора текста"
                                autoFocus
                            />

                            <div className="typing-text" key={round} ref={textRef} aria-hidden="true">
                                {words.map((word) =>
                                    word.space ? (
                                        <span key={word.start} ref={setCharRef(word.start)} className={charClass(word.start) + ' space'}>
                                            {' '}
                                        </span>
                                    ) : (
                                        <span key={word.start} className="word">
                                            {Array.from(word.token).map((char, j) => (
                                                <span key={j} ref={setCharRef(word.start + j)} className={charClass(word.start + j)}>
                                                    {char}
                                                </span>
                                            ))}
                                        </span>
                                    )
                                )}
                                {caret && (
                                    <span
                                        className={'caret' + (running ? '' : ' idle')}
                                        style={{ height: caret.height, transform: `translate(${caret.left}px, ${caret.top}px)` }}
                                    />
                                )}
                            </div>
                        </div>

                        {wrongLayout && <p className="warn">Похоже, включена русская раскладка — переключитесь на английскую</p>}

                        <p className="hint">Tab — новый текст · Esc — заново</p>
                    </div>

                    {/* Когда фокус ушёл — размываем всю игру целиком */}
                    {!focused && <div className="typing-overlay">нажмите сюда или любую клавишу</div>}
                </div>
            )}

            {finished && <p className="hint">Tab — новый текст · Esc — заново</p>}
        </div>
    );
}
