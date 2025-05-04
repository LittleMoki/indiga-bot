// keyboards.js
export function getMainKeyboard() {
	return {
		reply_markup: {
			keyboard: [['🔗 Реферальная ссылка'], ['🏆 Топ 10 лидеров', 'ℹ️ Помощь']],
			resize_keyboard: true,
		},
	}
}

export function askForSubscriptionKeyboard() {
	return {
		reply_markup: {
			inline_keyboard: [
				[
					{ text: 'Открыть канал', url: 'https://t.me/indiga_test_channel' },
					{ text: 'Открыть группу', url: 'https://t.me/indigatestgruppa' },
				],
				[{ text: 'Я подписался', callback_data: 'check_subscription' }],
			],
		},
	}
}
