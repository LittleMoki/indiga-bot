import { getMainKeyboard } from '../keyboards/mainKeyboard.js'
import { handleReferral } from '../utils/referralUtils.js'
import { checkSubscription } from '../utils/subscription.js'
import { upsertUser } from '../services/userService.js'

export default function startCommand(bot, prisma) {
	bot.start(async ctx => {
		if (!ctx.message || !('text' in ctx.message)) return
		if (!ctx.from) return

		const referrerId = ctx.message.text.split(' ')[1]
		const userId = ctx.from.id

		try {
			// 1. Если есть реферальный id → обрабатываем
			if (referrerId && referrerId !== userId.toString()) {
				await handleReferral(ctx, prisma, referrerId)
			}

			// 2. Проверяем подписку
			const isSubscribed = await checkSubscription(ctx)

			// 3. Создаём/обновляем пользователя
			await upsertUser(prisma, ctx, isSubscribed)

			// 4. Логика ответа
			if (isSubscribed) {
				await ctx.reply('👋 Salom! \tXush kelibsiz!', getMainKeyboard())
			} else {
				await ctx.reply(
					`Assalomu alaykum, Indiga botiga xush kelibsiz!\n🎁 Sovrinli tanlovimizda ishtirok eting va 1 000 000 so‘mgacha pul yutib olish imkoniyatini qo‘ldan boy bermang!\n\n🎯 Qoidalar oddiy:\n— Obuna bo‘ling\n— Do‘stlaringizni taklif qiling\n— Eng faol ishtirokchilar sovrin yutadi!`
				)

				await ctx.reply(
					`🎁 *Referal dasturi* \n\n` +
						`Do‘stlaringizni taklif qiling va ballar to‘plang! \n\n`,
					{
						parse_mode: 'Markdown',
						reply_markup: {
							inline_keyboard: [
								[{ text: 'Taklif qilish', callback_data: 'check_subscription' }],
							],
						},
					}
				)
			}
		} catch (error) {
			console.error('Start error:', error)
			await ctx.reply("Xatolik yuz berdi. Iltimos, keyinroq urunib ko'ring.")
		}
	})
}
