import { sendReferralInfo } from '../services/refferalService.js'

export default function referralCommand(bot, prisma) {
	// Кнопка в меню
	bot.hears('🔗 Doʻstingizni taklif qiling', async ctx => {
		await sendReferralInfo(ctx, prisma)
	})
}
