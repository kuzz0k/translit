import { useCallback, useEffect, useRef } from 'react';
import { reduceMotion } from '../lib/platform.ts';

// «Печатает» текст в поле ввода по одной букве (для кнопки 🎲)
export function useTypeIn(onChange: (text: string) => void): [typeIn: (text: string) => void, stop: () => void] {
    const timer = useRef<ReturnType<typeof setInterval>>(undefined);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const stop = useCallback(() => {
        clearInterval(timer.current);
        timer.current = undefined;
    }, []);

    const typeIn = useCallback((text: string) => {
        stop();

        if (reduceMotion) {
            onChangeRef.current(text);
            return;
        }

        const chars = Array.from(text);
        let shown = 0;
        onChangeRef.current('');

        timer.current = setInterval(() => {
            shown++;
            onChangeRef.current(chars.slice(0, shown).join(''));
            if (shown >= chars.length) stop();
        }, 30);
    }, [stop]);

    useEffect(() => stop, [stop]);

    return [typeIn, stop];
}
