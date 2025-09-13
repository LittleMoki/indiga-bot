export function askForSubscriptionKeyboard() {
	return {
		reply_markup: {
			inline_keyboard: [
				[
					{ text: 'Kanalni ochish', url: 'https://t.me/indiga_group' },
				],
				[{ text: 'Obuna bo‘ldim', callback_data: 'check_subscription' }],
			],
		},
	}
}
