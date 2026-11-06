import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { forcePlainTextCopy } from './lib/clipboard.ts';
import './styles.css';

forcePlainTextCopy();

const root = document.getElementById('root');
if (!root) throw new Error('Не найден элемент #root');

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>
);

// Офлайн-режим (PWA) — только в собранной версии, чтобы не мешать разработке
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}
