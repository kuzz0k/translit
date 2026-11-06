import { useCallback, useRef, type RefObject } from 'react';

// Перезапускает CSS-анимацию (shake, flash, pop…) на элементе.
// Можно передать свой ref, если он уже нужен для чего-то ещё (например, focus).
export function useAnimation<T extends HTMLElement>(
    className: string,
    existingRef?: RefObject<T | null>
): [RefObject<T | null>, () => void] {
    const ownRef = useRef<T>(null);
    const ref = existingRef ?? ownRef;

    const play = useCallback(() => {
        const element = ref.current;
        if (!element) return;
        element.classList.remove(className);
        void element.offsetWidth; // перезапуск анимации
        element.classList.add(className);
    }, [className, ref]);

    return [ref, play];
}
