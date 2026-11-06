import type { ComponentType } from 'react';
import NicknameTab from './components/NicknameTab.tsx';
import Tabs, { type TabInfo } from './components/Tabs.tsx';
import TranslitTab from './components/TranslitTab.tsx';
import TypingTab from './components/TypingTab.tsx';
import { useStoredState, type Guard } from './lib/storage.ts';

type TabId = 'translit' | 'nickname' | 'typing';

interface Tab extends TabInfo<TabId> {
    Component: ComponentType;
}

const TABS: readonly Tab[] = [
    { id: 'translit', label: 'транслит', Component: TranslitTab },
    { id: 'nickname', label: 'ник', Component: NicknameTab },
    { id: 'typing', label: 'тренажёр', Component: TypingTab },
];

const isTabId: Guard<TabId> = (value): value is TabId => TABS.some((tab) => tab.id === value);

export default function App() {
    const [active, setActive] = useStoredState<TabId>('translit:tab', 'translit', isTabId);
    const { Component } = TABS.find((tab) => tab.id === active) ?? TABS[0]!;

    return (
        <div className={'app' + (active === 'typing' ? ' wide' : '')}>
            <h1>Транслит</h1>
            <Tabs tabs={TABS} active={active} onChange={setActive} />
            <div className="panel" key={active} role="tabpanel">
                <Component />
            </div>
        </div>
    );
}
