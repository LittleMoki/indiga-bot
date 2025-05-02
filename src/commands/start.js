export default function startCommand(bot, prisma) {
    bot.start(async (ctx) => {
      if (!ctx.message || !('text' in ctx.message)) return;
      if (!ctx.from) return;
  
      const messageText = ctx.message.text;
      const referrerId = messageText.split(' ')[1] || null;
      const userId = ctx.from.id;
      const username = ctx.from.username;
      const firstName = ctx.from.first_name;
  
      try {
        let user = await prisma.user.findUnique({
          where: { userId: BigInt(userId) }
        });
  
        if (!user) {
          user = await prisma.user.create({
            data: {
              userId: BigInt(userId),
              username,
              firstName,
              referrerId: referrerId ? BigInt(referrerId) : null
            }
          });
  
          if (referrerId) {
            await prisma.user.update({
              where: { userId: BigInt(referrerId) },
              data: { points: { increment: 1 } }
            });
          }
        }
  
        if (user.isSubscribed) {
          await ctx.reply(`Добро пожаловать! Вот ссылка на группу: ${process.env.GROUP_LINK}`);
        } else {
          await ctx.reply('Пожалуйста, подпишитесь на наш канал @indiga_test_channel, чтобы получить доступ к группе.');
        }
      } catch (error) {
        console.error('Start command error:', error);
        await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
      }
    });
  }