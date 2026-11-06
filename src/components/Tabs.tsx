import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface TabInfo<Id extends string> {
    id: Id;
    label: string;
}

interface TabsProps<Id extends string> {
    tabs: readonly TabInfo<Id>[];
    active: Id;
    onChange: (id: Id) => void;
}

interface Indicator {
    left: number;
    width: number;
}

// Вкладки с полоской, которая плавно переезжает под активную
export default function Tabs<Id extends string>({ tabs, active, onChange }: TabsProps<Id>) {
    const buttons = useRef<Partial<Record<Id, HTMLButtonElement | null>>>({});
    const [indicator, setIndicator] = useState<Indicator | null>(null);

    const measure = useCallback(() => {
        const element = buttons.current[active];
        if (element) {
            setIndicator({ left: element.offsetLeft, width: element.offsetWidth });
        }
    }, [active]);

    useLayoutEffect(measure, [measure]);

    useEffect(() => {
        window.addEventListener('resize', measure);
        void document.fonts?.ready.then(measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure]);

    function onKeyDown(event: KeyboardEvent<HTMLElement>) {
        const index = tabs.findIndex((tab) => tab.id === active);
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        const next = tabs[(index + step + tabs.length) % tabs.length];
        if (!next) return;
        onChange(next.id);
        buttons.current[next.id]?.focus();
    }

    return (
        <nav className="tabs" role="tablist" onKeyDown={onKeyDown}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    ref={(element) => {
                        buttons.current[tab.id] = element;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={tab.id === active}
                    tabIndex={tab.id === active ? 0 : -1}
                    className={'tab' + (tab.id === active ? ' active' : '')}
                    onClick={() => onChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
            {indicator && (
                <span
                    className="tab-indicator"
                    style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
                />
            )}
        </nav>
    );
}
