// Словарь для замены символов
const translitTable = {
    'а': 'a',
    'б': '6',
    'в': 'B',
    'г': 'r',
    'д': 'g',
    'е': 'e',
    'ё': 'é',
    'ж': '}|{',
    'з': '3',
    'и': 'u',
    'й': 'ú',
    'к': 'k',
    'л': 'Jl',
    'м': 'M',
    'н': 'H',
    'о': 'o',
    'п': 'n',
    'р': 'p',
    'с': 'c',
    'т': 'T',
    'у': 'y',
    'ф': '%',
    'х': 'x',
    'ц': 'u,',
    'ч': '4',
    'ш': 'w',
    'щ': 'w,',
    'ъ': 'b',
    'ы': 'bl',
    'ь': 'b',
    'э': 'e',
    'ю': 'l-0',
    'я': '9',
};

const form = document.getElementById('form');
const input = document.getElementById('messageInput');
const result = document.getElementById('result');
const output = document.getElementById('output');
const copyButton = document.getElementById('copyButton');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let currentText = '';
let typingTimer = null;
let copyTimer = null;

function transliterate(message) {
    let correctedMessage = '';

    // Проходим по каждому символу сообщения
    for (const char of message.toLowerCase()) {
        // Заменяем символ, если он есть в таблице
        correctedMessage += translitTable[char] ?? char;
    }

    return correctedMessage;
}

// Печатает текст посимвольно (не дольше ~0.6 секунды)
function typeText(text) {
    clearInterval(typingTimer);

    if (reduceMotion) {
        output.textContent = text;
        return;
    }

    const chars = Array.from(text);
    const step = Math.max(1, Math.ceil(chars.length / 30));
    let shown = 0;

    output.textContent = '';
    output.classList.add('typing');

    typingTimer = setInterval(() => {
        shown = Math.min(chars.length, shown + step);
        output.textContent = chars.slice(0, shown).join('');

        if (shown >= chars.length) {
            clearInterval(typingTimer);
            output.classList.remove('typing');
        }
    }, 20);
}

function shake(element) {
    element.classList.remove('shake');
    void element.offsetWidth; // перезапуск анимации
    element.classList.add('shake');
}

function displayMessage() {
    const message = input.value.trim();

    // Пустое сообщение — просто подсвечиваем поле, старый результат не трогаем
    if (!message) {
        shake(input);
        input.focus();
        return;
    }

    currentText = transliterate(message);

    result.hidden = false;
    result.classList.remove('appear');
    void result.offsetWidth;
    result.classList.add('appear');

    resetCopyButton();
    typeText(currentText);

    input.value = '';
    input.focus();
}

// Копирование только простого текста, без шрифтов и цветов
async function copyPlainText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Запасной вариант для старых браузеров и file://
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

function resetCopyButton() {
    clearTimeout(copyTimer);
    copyButton.textContent = 'копировать';
    copyButton.classList.remove('copied');
}

copyButton.addEventListener('click', async () => {
    if (!currentText) return;

    const ok = await copyPlainText(currentText);
    copyButton.textContent = ok ? 'скопировано ✓' : 'не удалось';
    copyButton.classList.toggle('copied', ok);

    clearTimeout(copyTimer);
    copyTimer = setTimeout(resetCopyButton, 1500);
});

// Если текст выделили и скопировали вручную (Ctrl+C) — тоже кладём
// в буфер только простой текст, без оформления
document.addEventListener('copy', (event) => {
    const selection = window.getSelection().toString();
    if (!selection || !event.clipboardData) return;

    event.preventDefault();
    event.clipboardData.setData('text/plain', selection);
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    displayMessage();
});

input.addEventListener('animationend', () => input.classList.remove('shake'));
