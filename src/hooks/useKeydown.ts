import { useEffect, useRef } from 'react';

// Слушает нажатия клавиш на всей странице, пока компонент на экране
export function useKeydown(handler: (event: KeyboardEvent) => void): void {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        const listener = (event: KeyboardEvent) => handlerRef.current(event);
        document.addEventListener('keydown', listener);
        return () => document.removeEventListener('keydown', listener);
    }, []);
}
