// Копирование только простого текста, без шрифтов и цветов
export async function copyPlainText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Запасной вариант для старых браузеров
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch {
            ok = false;
        }
        textarea.remove();
        return ok;
    }
}

// Если текст выделили и скопировали вручную (Ctrl+C) — тоже кладём
// в буфер только простой текст, без оформления
export function forcePlainTextCopy(): void {
    document.addEventListener('copy', (event: ClipboardEvent) => {
        const selection = window.getSelection()?.toString();
        if (!selection || !event.clipboardData) return;

        event.preventDefault();
        event.clipboardData.setData('text/plain', selection);
    });
}
