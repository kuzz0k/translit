export type TranslitTable = Readonly<Record<string, string>>;

// Основная таблица — твой «хакерский» транслит
export const translitTable: TranslitTable = {
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

// Для ников — только буквы и цифры, похожие по виду
export const nicknameTable: TranslitTable = {
    ...translitTable,
    'ё': 'e',
    'ж': 'X',
    'й': 'u',
    'ф': 'qp',
    'ц': 'U',
    'щ': 'W',
    'ю': 'IO',
};

// Для тренажёра — то же, что основная, но без é и ú, которых нет на клавиатуре
export const typingTable: TranslitTable = {
    ...translitTable,
    'ё': 'e',
    'й': 'u',
};
