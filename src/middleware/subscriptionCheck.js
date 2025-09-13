import { askForSubscriptionKeyboard } from '../keyboards/subscriptionKeyboard.js'
import { checkSubscription } from '../utils/subscription.js'

export default function subscriptionCheck(prisma) {
	return async (ctx, next) => {
		if (!ctx.message || !ctx.from) return next()

		const userId = ctx.from.id

		try {
			// Для команды /start пропускаем проверку подписки (но сохраняем статус)
			if (ctx.message.text && ctx.message.text.startsWith('/start')) {
				const isSubscribed = await checkSubscription(ctx)

				await prisma.user.update({
					where: { userId: BigInt(userId) },
					data: { isSubscribed },
				})

				return next()
			}

			// Для всех остальных команд - проверяем подписку и блокируем если не подписан
			const user = await prisma.user.findUnique({
				where: { userId: BigInt(userId) },
			})

			// Если пользователя нет в базе - просим начать с /start
			if (!user.userId) {
				await ctx.telegram.sendMessage(
					Number(user.userId),
					'Iltimos, avval /start buyrug‘i orqali botni ishga tushiring.'
				)
				return
			}

			// Проверяем текущий статус подписки
			const [channelMember] = await Promise.all([
				ctx.telegram.getChatMember('@indiga_group', userId)
			])

			const isCurrentlySubscribed =
				['member', 'administrator', 'creator'].includes(channelMember.status)

			// Обновляем статус в базе
			await prisma.user.update({
				where: { userId: BigInt(userId) },
				data: { isSubscribed: isCurrentlySubscribed },
			})

			// Если не подписан - блокируем действия
			if (!isCurrentlySubscribed) {
				await ctx.telegram.sendMessage(
					Number(user.userId),
					'Botdan foydalanish uchun quyidagilarga obuna bo‘lishingiz kerak:\n' +
						'1. Kanal: @indiga_group\n' +
						'Obuna bo‘lgach, OBUNA BOLDIM tugmasini bosing.',
					askForSubscriptionKeyboard()
				)
				return
			}

			return next()
		} catch (error) {
			console.error('Subscription check error:', error)
			// В случае ошибки проверки - разрешаем продолжать (чтобы не блокировать бота)
			return next()
		}
	}
}
