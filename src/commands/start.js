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
			// Обработка реферальной ссылки
			const referralResult = await handleReferral(ctx, prisma)

			// Проверка подписки
			const isSubscribed = await checkSubscription(ctx)

			// Создание/обновление пользователя
			await prisma.user.upsert({
				where: { userId: Number(userId) },
				create: {
					userId: Number(userId),
					username: ctx.from.username,
					firstName: ctx.from.first_name,
					isSubscribed,
				},
				update: {
					isSubscribed,
				},
			})

			if (isSubscribed) {
				await handleSubscribedUser(ctx, username, referralResult)
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

	// Отправка уведомления в группу
	// if (process.env.GROUP_CHAT_ID) {
	//   try {
	//     if (referralResult?.referrer) {
	//       welcomeMessage += `\n\nТебя пригласил: @${referralResult.referrer.username || 'Аноним'}`;

	//       await ctx.telegram.sendMessage(
	//         process.env.GROUP_CHAT_ID,
	//         `🎉 Новый участник по рефералу!\n\n` +
	//         `К нам присоединился: @${username}\n` +
	//         `По приглашению: @${referralResult.referrer.username || 'Аноним'}\n` +
	//         `Давайте поприветствуем! 👋`
	//       );
	//     } else {
	//       await ctx.telegram.sendMessage(
	//         process.env.GROUP_CHAT_ID,
	//         `🎉 Новый участник!\n\n` +
	//         `К нам присоединился: @${username}\n` +
	//         `Давайте поприветствуем! 👋`
	//       );
	//     }
	//   } catch (groupError) {
	//     console.error('Ошибка отправки в группу:', groupError);
	//   }
	// }

	await ctx.reply(welcomeMessage)
	await showMainMenu(ctx)
}
