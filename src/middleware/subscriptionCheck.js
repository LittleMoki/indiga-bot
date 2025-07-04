import { askForSubscriptionKeyboard } from '../keyboards.js'

export default function createSubscriptionCheck(prisma) {
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
			if (!user) {
				await ctx.telegram.sendMessage(
					Number(user.userId),
					'Iltimos, avval /start buyrug‘i orqali botni ishga tushiring.'
				)
				return
			}

			// Проверяем текущий статус подписки
			const [channelMember, groupMember] = await Promise.all([
				ctx.telegram.getChatMember('@indiga_test_channel', userId),
				ctx.telegram.getChatMember('@indigatestgruppa', userId),
			])

			const isCurrentlySubscribed =
				['member', 'administrator', 'creator'].includes(channelMember.status) &&
				['member', 'administrator', 'creator'].includes(groupMember.status)

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
						'1. Kanal: @indiga_test_channel\n' +
						'2. Guruh: @indigatestgruppa\n\n' +
						'Obuna bo‘lgach, /start tugmasini bosing.',
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

// Вспомогательная функция проверки подписки
async function checkSubscription(ctx) {
	try {
		const [channelMember, groupMember] = await Promise.all([
			ctx.telegram.getChatMember('@indiga_test_channel', ctx.from.id),
			ctx.telegram.getChatMember('@indigatestgruppa', ctx.from.id),
		])

		return (
			['member', 'administrator', 'creator'].includes(channelMember.status) &&
			['member', 'administrator', 'creator'].includes(groupMember.status)
		)
	} catch (error) {
		console.error('Check subscription error:', error)
		return false
	}
}
