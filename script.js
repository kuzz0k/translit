
// Словарь для замены символов по таблице из файла
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

function transliterate(message) {
    let correctedMessage = '';
    
    let lowerCaseMessage = message.toLowerCase();

    // Проходим по каждому символу сообщения
    for (let char of lowerCaseMessage) {
        // Заменяем символ, если он есть в таблице
        correctedMessage += translitTable[char] || char;
    }
    
    return correctedMessage;
}

function displayMessage() {
    // Получаем значение, введённое в текстовое поле
    let message = document.getElementById('messageInput').value;

    // Корректируем сообщение согласно таблице
    let correctedMessage = transliterate(message);

    // Выводим скорректированное сообщение на экран
    if (correctedMessage) {
        document.getElementById('output').innerText = correctedMessage;
    } else {
        document.getElementById('output').innerText = "";
    }
}
