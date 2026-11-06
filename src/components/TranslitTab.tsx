import { useRef, useState } from 'react';
import InputRow from './InputRow.tsx';
import { randomPhrases } from '../data/phrases.ts';
import { useAnimation } from '../hooks/useAnimation.ts';
import { useCopy } from '../hooks/useCopy.ts';
import { useKeydown } from '../hooks/useKeydown.ts';
import { useTypeIn } from '../hooks/useTypeIn.ts';
import { isModEnter, randomItem } from '../lib/platform.ts';
import { transliterate } from '../lib/translit.ts';

export default function TranslitTab() {
    const inputRef = useRef<HTMLInputElement>(null);
    const lastPhrase = useRef<string | undefined>(undefined);
    const [value, setValue] = useState('');
    const { status, copy } = useCopy();
    const [, shake] = useAnimation('shake', inputRef);
    const [outputRef, flash] = useAnimation<HTMLParagraphElement>('flash');
    const [typeIn, stopTypeIn] = useTypeIn(setValue);

    // Живой перевод: результат обновляется при каждом нажатии клавиши
    const result = value.trim() ? transliterate(value.trim()) : '';

    // Enter / «Копировать»
    async function copyResult() {
        if (!result) {
            shake();
            inputRef.current?.focus();
            return;
        }
        if (await copy(result)) flash();
    }

    // Ctrl+Enter / ⌘+Enter тоже копирует — даже если поле не в фокусе
    useKeydown((event) => {
        if (!isModEnter(event)) return;
        event.preventDefault();
        void copyResult();
    });

    function dice() {
        const phrase = randomItem(randomPhrases, lastPhrase.current);
        lastPhrase.current = phrase;
        typeIn(phrase);
        inputRef.current?.focus();
    }

    return (
        <>
            <InputRow
                inputRef={inputRef}
                value={value}
                onChange={(text) => {
                    stopTypeIn(); // пользователь начал печатать сам
                    setValue(text);
                }}
                onSubmit={() => void copyResult()}
                onDice={dice}
                diceTitle="Случайная фраза"
                button={status === 'done' ? 'Готово ✓' : 'Копировать'}
                placeholder="Введите ваше сообщение"
                label="Сообщение"
            />

            <p className="hint">Enter — скопировать</p>

            {result && (
                <div className="result">
                    <p ref={outputRef} className="output" aria-live="polite">{result}</p>
                </div>
            )}
        </>
    );
}
