export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ctrl+Enter (Windows, Linux) или ⌘+Enter (Mac)
export function isModEnter(event: KeyboardEvent): boolean {
    return event.key === 'Enter' && (event.ctrlKey || event.metaKey);
}

export function randomItem<T>(items: readonly T[], except?: T): T {
    if (items.length === 0) throw new Error('randomItem: empty list');

    let item: T;
    do {
        item = items[Math.floor(Math.random() * items.length)] as T;
    } while (item === except && items.length > 1);
    return item;
}
