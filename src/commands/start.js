import { getMainKeyboard } from '../keyboards.js'
import { generateReferralLink, handleReferral } from '../utils/referralUtils.js'

export default function startCommand(bot, prisma) {
	bot.start(async ctx => {
		if (!ctx.message || !('text' in ctx.message)) return
		if (!ctx.from) return

		const referrerId = ctx.message.text.split(' ')[1]
		const userId = ctx.from.id
		const username = ctx.from.username || 'Новый пользователь'

		try {
			// 1. Сначала обрабатываем реферальную ссылку
			if (referrerId && referrerId !== userId.toString()) {
				await handleReferral(ctx, prisma, referrerId)
			}

			// 2. Затем проверяем подписку
			const isSubscribed = await checkSubscription(ctx)

			// 3. Создаем/обновляем пользователя
			await prisma.user.upsert({
				where: { userId: BigInt(userId) },
				create: {
					userId: BigInt(userId),
					username: ctx.from.username,
					firstName: ctx.from.first_name,
					isSubscribed,
				},
				update: {
					isSubscribed,
				},
			})

			// 4. Обрабатываем в зависимости от подписки
			if (isSubscribed) {
				await handleSubscribedUser(ctx, username)
			} else {
				await askForSubscription(ctx)
			}
		} catch (error) {
			console.error('Start error:', error)
			await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.')
		}
	})

	bot.hears('🔗 Реферальная ссылка', async ctx => {
		try {
			const referralLink = await generateReferralLink(ctx)
			const user = await prisma.user.findUnique({
				where: { userId: Number(ctx.from.id) },
				include: { _count: { select: { referrals: true } } },
			})

			await ctx.reply(
				`🎁 *Реферальная программа*\n\n` +
					`Приглашайте друзей и получайте баллы!\n\n` +
					`🔗 Ваша ссылка:\n` +
					`${referralLink}\n\n` +
					`👥 Приглашено: ${user?._count?.referrals || 0} человек\n` +
					`⭐ Ваши баллы: ${user?.points || 0}`,
				{ parse_mode: 'Markdown' }
			)
		} catch (error) {
			console.error('Referral link error:', error)
			await ctx.reply('Произошла ошибка при генерации ссылки.')
		}
	})
	bot.hears('ℹ️ Помощь', async ctx => {
		try {
			await ctx.reply(`За помошью обрашайтесь @nurullayev_me`)
		} catch (error) {
			console.error('Referral link error:', error)
			await ctx.reply('Произошла ошибка при помощь.')
		}
	})
}

async function checkSubscription(ctx) {
	try {
		const [channelMember, groupMember] = await Promise.all([
			ctx.telegram.getChatMember('@indiga_test_channel', ctx.from.id),
			ctx.telegram.getChatMember('@indigatestgruppa', ctx.from.id),
		])

		const isChannelSubscribed = ['member', 'administrator', 'creator'].includes(
			channelMember.status
		)
		const isGroupSubscribed = ['member', 'administrator', 'creator'].includes(
			groupMember.status
		)

		return isChannelSubscribed && isGroupSubscribed
	} catch (error) {
		console.error('Subscription check error:', error)
		return false
	}
}

async function showMainMenu(ctx) {
	await ctx.reply('Главное меню:', getMainKeyboard())
}

async function handleSubscribedUser(ctx, username, referralResult) {
	let welcomeMessage = `👋 Добро пожаловать, ${username}!`

	await ctx.reply(welcomeMessage)
	await showMainMenu(ctx)
}

async function askForSubscription(ctx) {
	await ctx.reply(
		'Для использования бота подпишитесь на:\n' +
			'1. Канал: @indiga_test_channel\n' +
			'2. Группу: @indigatestgruppa\n\n' +
			'После подписки нажмите /start',
		{
			reply_markup: {
				inline_keyboard: [
					[
						{ text: 'Открыть канал', url: 'https://t.me/indiga_test_channel' },
						{ text: 'Открыть группу', url: 'https://t.me/indigatestgruppa' },
					],
					[{ text: 'Я подписался', callback_data: 'check_subscription' }],
				],
			},
		}
	)
}
