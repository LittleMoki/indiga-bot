// bot.js (основной файл)
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import cron from 'node-cron'
import { Telegraf } from 'telegraf'
import helpCommand from './commands/help.js'
import leaderboardCommand from './commands/leaderboard.js'
import referralCommand from './commands/referral.js'
import startCommand from './commands/start.js'
import { setupHandlers } from './handlers/index.js'
import { privateChatOnly } from './middleware/privateChatOnly.js'
import subscriptionCheck from './middleware/subscriptionCheck.js'
import { sendLeaderboard } from './utils/sendLeaderboard.js'

dotenv.config()

const prisma = new PrismaClient()
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// Middleware
bot.use(subscriptionCheck(prisma))
bot.use(privateChatOnly)
// Обработчик кнопок
setupHandlers(bot, prisma)
// Commands
startCommand(bot, prisma)
leaderboardCommand(bot, prisma)
referralCommand(bot, prisma)
helpCommand(bot)
// Schedule daily leaderboard at 20:00
cron.schedule('0 * * * *', () => sendLeaderboard(bot, prisma))
// Start bot
bot
	.launch()
	.then(() => console.log('Bot is running'))
	.catch(err => console.error('Bot launch error:', err))

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
