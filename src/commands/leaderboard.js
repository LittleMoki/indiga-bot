export default function leaderboardCommand(bot, prisma) {
	bot.hears('🏆 Топ 10 лидеров', async ctx => {
		try {
			const topUsers = await prisma.user.findMany({
				where: { points: { gt: 0 } },
				orderBy: { points: 'desc' },
				take: 10,
			})

			if (topUsers.length === 0) {
				await ctx.reply('Пока нет данных для рейтинга.')
				return
			}

			let leaderboardText = '🏆 ТОП-рефералов Indiga:\n\n'
			topUsers.forEach((user, index) => {
				leaderboardText += `${index + 1}. @${user.username || 'unknown'} – ${
					user.points
				} баллов\n`
			})

			await ctx.reply(leaderboardText)
		} catch (error) {
			console.error('Leaderboard command error:', error)
			await ctx.reply('Произошла ошибка при получении рейтинга.')
		}
	})
}
