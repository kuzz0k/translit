import { nicknameTable, translitTable, type TranslitTable } from './tables.ts';

export function transliterate(message: string, table: TranslitTable = translitTable): string {
    let result = '';

    // Проходим по каждому символу и заменяем, если он есть в таблице
    for (const char of message.toLowerCase()) {
        result += table[char] ?? char;
    }

    return result;
}

// Ник без украшений: только латиница, цифры и разделитель между словами
function cleanName(message: string, separator: string): string {
    return transliterate(message, nicknameTable)
        .replace(/[\s\-–—.]+/g, '_')       // пробелы, дефисы, точки → _
        .replace(/[^A-Za-z0-9_]/g, '')     // всё остальное убираем
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .replace(/_/g, separator);
}

export const TAG_MAX_LENGTH = 8;

// Тег для «power»: латиница сохраняет регистр (PRO), кириллица — в транслит
export function cleanTag(tag: string): string {
    let result = '';
    for (const char of tag) {
        result += nicknameTable[char.toLowerCase()] ?? char;
    }
    return result.replace(/[^A-Za-z0-9]/g, '').slice(0, TAG_MAX_LENGTH);
}

export type TagPosition = 'start' | 'end';

export interface NicknameOptions {
    /** Без _ между словами */
    joined?: boolean;
    /** xX_ник_Xx */
    skill?: boolean;
    /** Тег, например PRO → PRO_ник или ник_PRO */
    tag?: string;
    /** Где стоит тег: в начале или в конце */
    tagPosition?: TagPosition;
}

// Ник: только латиница, цифры и _
export function toNickname(
    message: string,
    { joined = false, skill = false, tag = '', tagPosition = 'start' }: NicknameOptions = {}
): string {
    const separator = joined ? '' : '_';
    const name = cleanName(message, separator);
    if (!name) return '';

    const word = cleanTag(tag);
    let nick = name;
    if (word) nick = tagPosition === 'start' ? word + separator + name : name + separator + word;
    if (skill) nick = `xX${separator}${nick}${separator}Xx`;
    return nick;
}
