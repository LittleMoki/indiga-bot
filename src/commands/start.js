import { askForSubscriptionKeyboard, getMainKeyboard } from '../keyboards.js'
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
				await ctx.reply(`
Assalomu alaykum, Indiga botiga xush kelibsiz!  
🎁 Sovrinli tanlovimizda ishtirok eting va 1 000 000 so‘mgacha pul yutib olish imkoniyatini qo‘ldan boy bermang!

🎯 Qoidalar oddiy:  
— Obuna bo‘ling  
— Do‘stlaringizni taklif qiling  
— Eng faol ishtirokchilar sovrin yutadi!`)
				await askForSubscription(ctx)
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
	getMainKeyboard()
}

async function handleSubscribedUser(ctx, username) {
	await showMainMenu(ctx)
}

async function askForSubscription(ctx) {
	await ctx.reply(
		"Botdan foydalanish uchun quyidagilarga obuna bo'ling:\n" +
			'1. Kanal: @indiga_test_channel\n' +
			'2. Guruh: @indigatestgruppa\n\n' +
			'Obuna bo‘lganingizdan so‘ng /start tugmasini bosing.',
		askForSubscriptionKeyboard()
	)
}
