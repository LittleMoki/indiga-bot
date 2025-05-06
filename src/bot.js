// bot.js (основной файл)
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import cron from 'node-cron'
import { Telegraf } from 'telegraf'
import leaderboardCommand from './commands/leaderboard.js'
import startCommand from './commands/start.js'
import { getMainKeyboard } from './keyboards.js'
import { privateChatOnly } from './middleware/privateChatOnly.js'
import createSubscriptionCheck from './middleware/subscriptionCheck.js'
import { sendDailyLeaderboard } from './utils/sendLeaderboard.js'

dotenv.config()

const prisma = new PrismaClient()
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// Middleware
bot.use(createSubscriptionCheck(prisma))
bot.use(privateChatOnly)
// Обработчик кнопки проверки подписки
bot.action('check_subscription', async ctx => {
	try {
		await ctx.answerCbQuery('Obunalarni tekshiryapmiz...')

		// Удаляем предыдущее сообщение с кнопками
		try {
			if (ctx.callbackQuery.message) {
				await ctx.deleteMessage()
			}
		} catch (deleteError) {
			console.error('Error deleting message:', deleteError)
		}

		// Проверяем подписки пользователя
		const userId = ctx.from.id
		const [channelMember, groupMember] = await Promise.all([
			ctx.telegram.getChatMember('@indiga_test_channel', userId),
			ctx.telegram.getChatMember('@indigatestgruppa', userId),
		])

		const isSubscribed =
			['member', 'administrator', 'creator'].includes(channelMember.status) &&
			['member', 'administrator', 'creator'].includes(groupMember.status)

		if (isSubscribed) {
			// Обновляем статус подписки в базе данных
			await prisma.user.update({
				where: { userId: BigInt(userId) },
				data: { isSubscribed: true },
			})

			// Отправляем сообщение об успешной подписке
			await ctx.reply(
				'✅ Siz barcha kerakli kanallarga obuna bo‘ldingiz!',
				getMainKeyboard()
			)

			// Создаем искусственное сообщение для имитации /start
			const fakeUpdate = {
				...ctx.update,
				message: {
					text: '/start',
					from: ctx.from,
					chat: ctx.chat,
				},
			}

			// Обрабатываем как новый /start
			await bot.handleUpdate(fakeUpdate)

			// Удаляем сообщение об успехе через 3 секунды
		} else {
			// Если пользователь не подписан, показываем новое сообщение с инструкциями
			await ctx.reply(
				'❌ Siz hali barcha kerakli kanallarga obuna bo‘lmagansiz.\n\n' +
					'Davom etish uchun quyidagilarga obuna bo‘ling:\n' +
					'1. Kanal: @indiga_test_channel\n' +
					'2. Guruh: @indigatestgruppa\n\n' +
					'Obuna bo‘lgach, "Obuna bo‘ldim" tugmasini bosing.',
				{
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: 'Kanalni ochish',
									url: 'https://t.me/indiga_test_channel',
								},
								{
									text: 'Guruhni ochish',
									url: 'https://t.me/indigatestgruppa',
								},
							],
							[{ text: 'Obuna bo‘ldim', callback_data: 'check_subscription' }],
						],
					},
				}
			)
		}
	} catch (error) {
		console.error('Check subscription error:', error)
		await ctx.answerCbQuery(
			"Xatolik yuz berdi. Iltimos, keyinroq urunib ko'ring."
		)
	}
})
// Commands
startCommand(bot, prisma)
leaderboardCommand(bot, prisma)

// Schedule daily leaderboard at 20:00
cron.schedule('0 * * * *', () => sendDailyLeaderboard(bot, prisma))
// Start bot
bot
	.launch()
	.then(() => console.log('Bot is running'))
	.catch(err => console.error('Bot launch error:', err))

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
