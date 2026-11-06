import type { ReactNode, RefObject } from 'react';
import { useAnimation } from '../hooks/useAnimation.ts';

function DiceIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
        </svg>
    );
}

interface InputRowProps {
    inputRef: RefObject<HTMLInputElement | null>;
    value: string;
    onChange: (text: string) => void;
    onSubmit: () => void;
    onDice: () => void;
    diceTitle: string;
    button: ReactNode;
    placeholder: string;
    label: string;
}

// Поле ввода + 🎲 + кнопка справа — тот самый оригинальный дизайн
export default function InputRow({
    inputRef,
    value,
    onChange,
    onSubmit,
    onDice,
    diceTitle,
    button,
    placeholder,
    label,
}: InputRowProps) {
    const [diceRef, spin] = useAnimation<HTMLButtonElement>('spin');

    return (
        <form
            className="input-row"
            autoComplete="off"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <div className="field">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onAnimationEnd={(event) => event.currentTarget.classList.remove('shake')}
                    placeholder={placeholder}
                    aria-label={label}
                    spellCheck={false}
                    autoFocus
                />
                <button
                    ref={diceRef}
                    type="button"
                    className="dice"
                    title={diceTitle}
                    aria-label={diceTitle}
                    onClick={() => {
                        spin();
                        onDice();
                    }}
                >
                    <DiceIcon />
                </button>
            </div>{' '}
            {/* пробел выше — тот самый небольшой зазор между полем и кнопкой из оригинала */}
            <button type="submit" className="send">{button}</button>
        </form>
    );
}
