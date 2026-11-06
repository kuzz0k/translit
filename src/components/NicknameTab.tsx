import { useRef, useState, type ReactNode } from 'react';
import InputRow from './InputRow.tsx';
import { nicknameAdjectives, nicknameNouns, powerTags } from '../data/phrases.ts';
import { useAnimation } from '../hooks/useAnimation.ts';
import { useCopy } from '../hooks/useCopy.ts';
import { useKeydown } from '../hooks/useKeydown.ts';
import { useTypeIn } from '../hooks/useTypeIn.ts';
import { isModEnter, randomItem } from '../lib/platform.ts';
import { useStoredState, type Guard } from '../lib/storage.ts';
import { cleanTag, TAG_MAX_LENGTH, toNickname, type TagPosition } from '../lib/translit.ts';

// Многие игры ограничивают ник 16 символами
const LENGTH_LIMIT = 16;

interface NickSettings {
    joined: boolean;
    skill: boolean;
    power: boolean;
    tag: string;
    /** Необязательно: в сохранённых раньше настройках этого поля нет */
    tagPosition?: TagPosition;
}

const DEFAULT_SETTINGS: NickSettings = { joined: false, skill: false, power: false, tag: 'PRO', tagPosition: 'start' };

const POSITIONS: readonly { id: TagPosition; label: string }[] = [
    { id: 'start', label: 'в начале' },
    { id: 'end', label: 'в конце' },
];

const isSettings: Guard<NickSettings> = (value): value is NickSettings => {
    if (typeof value !== 'object' || value === null) return false;
    const s = value as Record<string, unknown>;
    return (
        typeof s.joined === 'boolean' &&
        typeof s.skill === 'boolean' &&
        typeof s.power === 'boolean' &&
        typeof s.tag === 'string' &&
        (s.tagPosition === undefined || s.tagPosition === 'start' || s.tagPosition === 'end')
    );
};

function plural(n: number, [one, few, many]: readonly [string, string, string]): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
}

interface ToggleProps {
    on: boolean;
    onClick: () => void;
    title: string;
    children: ReactNode;
}

function Toggle({ on, onClick, title, children }: ToggleProps) {
    return (
        <button type="button" className={'ghost small' + (on ? ' done' : '')} aria-pressed={on} title={title} onClick={onClick}>
            {children}
        </button>
    );
}

export default function NicknameTab() {
    const inputRef = useRef<HTMLInputElement>(null);
    const lastNick = useRef('');
    const [value, setValue] = useState('');
    const [settings, setSettings] = useStoredState('translit:nick-settings', DEFAULT_SETTINGS, isSettings);
    const { status, copy } = useCopy();
    const [, shake] = useAnimation('shake', inputRef);
    const [outputRef, flash] = useAnimation<HTMLParagraphElement>('flash');
    const [typeIn, stopTypeIn] = useTypeIn(setValue);

    const tagPosition = settings.tagPosition ?? 'start';
    const nick = toNickname(value, {
        joined: settings.joined,
        skill: settings.skill,
        tag: settings.power ? settings.tag : '',
        tagPosition,
    });

    const update = (patch: Partial<NickSettings>) => setSettings((s) => ({ ...s, ...patch }));

    // Свой тег — отдельное поле, чтобы не «прыгал», когда совпадает с готовым
    const [customTag, setCustomTag] = useState(() => (powerTags.includes(settings.tag) ? '' : settings.tag));
    const customActive = customTag !== '' && settings.tag === customTag;

    async function copyNick() {
        if (!nick) {
            shake();
            inputRef.current?.focus();
            return;
        }
        if (await copy(nick)) flash();
    }

    useKeydown((event) => {
        if (!isModEnter(event)) return;
        event.preventDefault();
        void copyNick();
    });

    function dice() {
        let next: string;
        do {
            next = `${randomItem(nicknameAdjectives)} ${randomItem(nicknameNouns)}`;
        } while (next === lastNick.current);
        lastNick.current = next;
        typeIn(next);
        inputRef.current?.focus();
    }

    return (
        <>
            <InputRow
                inputRef={inputRef}
                value={value}
                onChange={(text) => {
                    stopTypeIn();
                    setValue(text);
                }}
                onSubmit={() => void copyNick()}
                onDice={dice}
                diceTitle="Случайный ник"
                button={status === 'done' ? 'Готово ✓' : 'Копировать'}
                placeholder="Введите ник по-русски"
                label="Ник"
            />

            <p className="hint">Enter — скопировать</p>

            <div className="nick-settings">
                <Toggle on={settings.joined} onClick={() => update({ joined: !settings.joined })} title="Убрать _ между словами">
                    слитно
                </Toggle>
                <Toggle on={settings.skill} onClick={() => update({ skill: !settings.skill })} title="xX_ник_Xx">
                    skill
                </Toggle>
                <Toggle on={settings.power} onClick={() => update({ power: !settings.power })} title="Тег в начале или в конце ника, например PRO_ник">
                    power
                </Toggle>
            </div>

            {settings.power && (
                <div className="power-panel">
                    <div className="segmented" role="radiogroup" aria-label="Где поставить тег">
                        {POSITIONS.map((position) => (
                            <button
                                key={position.id}
                                type="button"
                                role="radio"
                                aria-checked={tagPosition === position.id}
                                className={'segment' + (tagPosition === position.id ? ' active' : '')}
                                onClick={() => update({ tagPosition: position.id })}
                            >
                                {position.label}
                            </button>
                        ))}
                    </div>
                    <div className="power-tags">
                        {powerTags.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                className={'chip' + (!customActive && settings.tag === tag ? ' active' : '')}
                                aria-pressed={!customActive && settings.tag === tag}
                                onClick={() => {
                                    setCustomTag('');
                                    update({ tag });
                                }}
                            >
                                {tag}
                            </button>
                        ))}
                        <input
                            className={'chip tag-input' + (customActive ? ' active' : '')}
                            value={customTag}
                            onChange={(event) => {
                                const tag = cleanTag(event.target.value);
                                setCustomTag(tag);
                                update({ tag: tag || DEFAULT_SETTINGS.tag });
                            }}
                            onFocus={(event) => event.currentTarget.select()}
                            placeholder="свой"
                            aria-label="Свой тег"
                            maxLength={TAG_MAX_LENGTH}
                            spellCheck={false}
                            autoComplete="off"
                        />
                    </div>
                </div>
            )}

            {nick && (
                <div className="result">
                    <p ref={outputRef} className="output" aria-live="polite">{nick}</p>
                    <p className={'nick-length' + (nick.length > LENGTH_LIMIT ? ' warn' : '')}>
                        {nick.length} {plural(nick.length, ['символ', 'символа', 'символов'])}
                        {nick.length > LENGTH_LIMIT && ' — длинновато для многих игр'}
                    </p>
                </div>
            )}
        </>
    );
}
