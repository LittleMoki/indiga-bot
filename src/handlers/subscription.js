import { getMainKeyboard } from '../keyboards/mainKeyboard.js'
import { askForSubscriptionKeyboard } from '../keyboards/subscriptionKeyboard.js'
import { checkSubscription } from '../utils/subscription.js'

export function setupSubscriptionHandler(bot, prisma) {
	bot.action('check_subscription', async ctx => {
		try {
			await ctx.answerCbQuery('Obunalarni tekshiryapmiz...')

			try {
				if (ctx.callbackQuery.message) {
					await ctx.deleteMessage()
				}
			} catch (deleteError) {
				console.error('Error deleting message:', deleteError)
			}
			const userId = ctx.from.id
			const isSubscribed = await checkSubscription(ctx)
			if (isSubscribed) {
				await prisma.user.update({
					where: { userId: BigInt(userId) },
					data: { isSubscribed: true },
				})

				await ctx.reply(
					'✅ Siz barcha kerakli kanallarga obuna bo‘ldingiz!',
					getMainKeyboard()
				)

				const fakeUpdate = {
					...ctx.update,
					message: {
						text: '/start',
						from: ctx.from,
						chat: ctx.chat,
					},
				}
				await bot.handleUpdate(fakeUpdate)
			} else {
				await ctx.reply(
					'❌ Siz hali barcha kerakli kanallarga obuna bo‘lmagansiz.\n\n' +
						'Davom etish uchun quyidagilarga obuna bo‘ling:\n' +
						'Kanal: @indiga_group\n' +
						'Obuna bo‘lgach, "Obuna bo‘ldim" tugmasini bosing.',
					askForSubscriptionKeyboard()
				)
			}
		} catch (error) {
			console.error('Check subscription error:', error)
			await ctx.answerCbQuery(
				"Xatolik yuz berdi. Iltimos, keyinroq urunib ko'ring."
			)
		}
	})
}
