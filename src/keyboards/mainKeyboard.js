export function getMainKeyboard() {
	return {
		reply_markup: {
			keyboard: [['🔗 Doʻstingizni taklif qiling'], ['🏆 Top 10 yetakchilar', 'ℹ️ Yordam']],
			resize_keyboard: true,
		},
	}
}
