export default function leaderboardCommand(bot, prisma) {
	bot.hears('🏆 Top 10 yetakchilar', async ctx => {
		try {
			const topUsers = await prisma.user.findMany({
				where: { points: { gt: 0 } },
				orderBy: { points: 'desc' },
				take: 10,
			})

			if (topUsers.length === 0) {
				await ctx.reply("Hozircha reyting uchun ma'lumotlar yo‘q.")
				return
			}

			let leaderboardText = '🏆 Indiga TOP-referallari:\n\n'
			topUsers.forEach((user, index) => {
				leaderboardText += `${index + 1}. @${user.username || 'unknown'} – ${
					user.points
				} ballar\n`
			})

			await ctx.reply(leaderboardText)
		} catch (error) {
			console.error('Leaderboard command error:', error)
			await ctx.reply("Xatolik yuz berdi. Iltimos, keyinroq urunib ko'ring.")
		}
	})
}
