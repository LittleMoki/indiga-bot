// keyboards.js

// Главное меню
export function getMainKeyboard() {
	return {
		reply_markup: {
			keyboard: [['🔗 Referal havola'], ['🏆 Top 10 yetakchilar', 'ℹ️ Yordam']],
			resize_keyboard: true,
		},
	}
}

// Клавиатура для подписки
export function askForSubscriptionKeyboard() {
	return {
		reply_markup: {
			inline_keyboard: [
				[
					{ text: 'Kanalni ochish', url: 'https://t.me/indiga_test_channel' },
					{ text: 'Guruhni ochish', url: 'https://t.me/indigatestgruppa' },
				],
				[{ text: 'Obuna bo‘ldim', callback_data: 'check_subscription' }],
			],
		},
	}
}

// Клавиатура с реферальной ссылкой (для подписанных)
export function referralKeyboard(referralLink) {
	return {
		reply_markup: {
			inline_keyboard: [
				[
					{ text: 'Taklif qilish', url: referralLink },
				],
			],
		},
	}
}
