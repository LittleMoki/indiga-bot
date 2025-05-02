import { Telegraf } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cron from 'node-cron';
import createSubscriptionCheck from './middleware/subscriptionCheck.js';
import startCommand from './commands/start.js';
import leaderboardCommand from './commands/leaderboard.js';
import { sendDailyLeaderboard } from './utils/sendLeaderboard.js';

dotenv.config();

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Middleware
bot.use(createSubscriptionCheck(prisma));

// Commands
startCommand(bot, prisma);
leaderboardCommand(bot, prisma);

// Schedule daily leaderboard at 20:00
cron.schedule('0 20 * * *', () => sendDailyLeaderboard(bot, prisma));

// Start bot
bot.launch()
  .then(() => console.log('Bot is running'))
  .catch(err => console.error('Bot launch error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));