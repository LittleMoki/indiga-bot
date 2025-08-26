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

			// 4. Логика
			if (isSubscribed) {
				// Подписан → сразу показываем реферальную ссылку
				await sendReferralInfo(ctx, prisma)
			} else {
				// Не подписан → приветствие + "псевдо" ссылка
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
								[
									{
										text: 'Taklif qilish',
										callback_data: 'check_subscription',
									},
								],
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

	bot.hears('🔗 Referal havola', async ctx => {
		try {
			const referralLink = await generateReferralLink(ctx)
			const user = await prisma.user.findUnique({
				where: { userId: Number(ctx.from.id) },
				include: { _count: { select: { referrals: true } } },
			})

			await ctx.reply(
				`🎁 *Referal dasturi* \n\n` +
					`Do‘stlaringizni taklif qiling va ballar to‘plang! \n\n` +
					`🔗 Sizning havolangiz: \n` +
					`${referralLink}\n\n` +
					`👥 Taklif qilinganlar: ${user?._count?.referrals || 0} kishi \n` +
					`⭐ Ballaringiz: ${user?.points || 0}`,
				{ parse_mode: 'Markdown' }
			)
		} catch (error) {
			console.error('Referral link error:', error)
			await ctx.reply("Xatolik yuz berdi. Iltimos, keyinroq urunib ko'ring.")
		}
	})
	bot.hears('ℹ️ Yordam', async ctx => {
		try {
			await ctx.reply(`🆘 Yordam kerakmi? \n\n` + `👉 @nurullayev_me`)
		} catch (error) {
			console.error('Referral link error:', error)
			await ctx.reply("Xatolik yuz berdi. Iltimos, keyinroq urunib ko'ring.")
		}
	})
	// 🔗 Кнопка проверки подписки
	bot.action('check_subscription', async ctx => {
		try {
			const isSubscribed = await checkSubscription(ctx)
			if (isSubscribed) {
				await ctx.answerCbQuery('✅ Siz muvaffaqiyatli obuna bo‘ldingiz!')
				await sendReferralInfo(ctx, prisma, true, ctx) // true = редактируем сообщение
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

	// 🔗 Кнопка "Taklif qilish"
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
async function sendReferralInfo(ctx, prisma, edit = false) {
	const referralLink = await generateReferralLink(ctx)
	const user = await prisma.user.findUnique({
		where: { userId: Number(ctx.from.id) },
		include: { _count: { select: { referrals: true } } },
	})

	const text =
		`🎁 *Referal dasturi* \n\n` +
		`Do‘stlaringizni taklif qiling va ballar to‘plang! \n\n` +
		`👥 Taklif qilinganlar: ${user?._count?.referrals || 0} kishi \n` +
		`⭐ Ballaringiz: ${user?.points || 0}\n\n` +
		`🔗 Sizning havolangiz: \n${referralLink}`

	if (edit && ctx.callbackQuery?.message) {
		await ctx.editMessageText(text, { parse_mode: 'Markdown' })
	} else {
		await ctx.reply(text, { parse_mode: 'Markdown' })
	}
}
