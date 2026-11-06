import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export type Guard<T> = (value: unknown) => value is T;

export const isBoolean: Guard<boolean> = (value) => typeof value === 'boolean';
export const isNumber: Guard<number> = (value): value is number => typeof value === 'number' && Number.isFinite(value);
export const isStringArray: Guard<string[]> = (value): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

export function loadJSON(key: string): unknown {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? undefined : JSON.parse(raw);
    } catch {
        return undefined;
    }
}

export function saveJSON(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Хранилище недоступно (приватный режим) — живём без сохранения
    }
}

// useState, который помнит значение между перезагрузками
export function useStoredState<T>(key: string, fallback: T, isValid: Guard<T>): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        const saved = loadJSON(key);
        return isValid(saved) ? saved : fallback;
    });

    useEffect(() => {
        saveJSON(key, value);
    }, [key, value]);

    return [value, setValue];
}
