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
