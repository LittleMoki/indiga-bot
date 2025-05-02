// keyboards.js
export function getMainKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['🔗 Реферальная ссылка'],
                ['🏆 Топ 10 лидеров', 'ℹ️ Помощь']
            ],
            resize_keyboard: true
        }
    };
}