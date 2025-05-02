export async function sendDailyLeaderboard(bot, prisma) {
    try {
      const topUsers = await prisma.user.findMany({
        where: { points: { gt: 0 } },
        orderBy: { points: 'desc' },
        take: 10
      });
  
      if (topUsers.length === 0) return;
  
      let leaderboardText = '🏆 ТОП-рефералов Indiga:\n\n';
      topUsers.forEach((user, index) => {
        leaderboardText += `${index + 1}. @${user.username || 'unknown'} – ${user.points} баллов\n`;
      });
  
      await bot.telegram.sendMessage(process.env.GROUP_CHAT_ID, leaderboardText);
    } catch (error) {
      console.error('Error sending daily leaderboard:', error);
    }
  }