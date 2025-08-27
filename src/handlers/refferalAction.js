import { sendReferralInfo } from '../services/refferalService.js'
import { checkSubscription } from '../utils/subscription.js'

export function setupRefferalHandler(bot, prisma) {
	// Проверка подписки
	bot.action('check_subscription', async ctx => {
		try {
			const isSubscribed = await checkSubscription(ctx)
			if (isSubscribed) {
				await ctx.answerCbQuery('✅ Siz muvaffaqiyatli obuna bo‘ldingiz!')
				await sendReferralInfo(ctx, prisma, true) // редактируем
			} else {
				await ctx.answerCbQuery("❌ Siz hali obuna bo'lmadingiz!", {
					show_alert: true,
				})
			}
		} catch (error) {
			console.error('Check subscription error:', error)
			await ctx.reply('Xatolik yuz berdi. Keyinroq urinib ko‘ring.')
		}
	})

	// Запрос реферальной ссылки
	bot.action('get_ref_link', async ctx => {
		try {
			const isSubscribed = await checkSubscription(ctx)
			if (!isSubscribed) {
				return ctx.answerCbQuery('❌ Avval kanal va guruhga obuna bo‘ling!', {
					show_alert: true,
				})
			}
			await sendReferralInfo(ctx, prisma)
		} catch (error) {
			console.error('Get referral link error:', error)
			await ctx.reply("Xatolik yuz berdi. Iltimos, keyinroq urunib ko'ring.")
		}
	})
}
