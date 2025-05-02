
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
          // Проверяем подписку на канал
          let isSubscribed = false;
          try {
              const member = await ctx.telegram.getChatMember(
                  process.env.CHANNEL_USERNAME,
                  userId
              );
              isSubscribed = ['member', 'administrator', 'creator'].includes(member.status);
          } catch (error) {
              console.error('Error checking subscription:', error);
          }

          // Работа с пользователем в БД
          let user = await prisma.user.findUnique({
              where: { userId: BigInt(userId) }
          });

          if (!user) {
              user = await prisma.user.create({
                  data: {
                      userId: BigInt(userId),
                      username,
                      firstName,
                      referrerId: referrerId ? BigInt(referrerId) : null,
                      isSubscribed
                  }
              });

              if (referrerId) {
                  await prisma.user.update({
                      where: { userId: BigInt(referrerId) },
                      data: { points: { increment: 1 } }
                  });
              }
          } else if (user.isSubscribed !== isSubscribed) {
              await prisma.user.update({
                  where: { userId: BigInt(userId) },
                  data: { isSubscribed }
              });
          }

          // Отправка соответствующего сообщения
          if (isSubscribed) {
              // Если подписан - показываем меню
              await ctx.reply('Выберите действие:', {
                  reply_markup: {
                    keyboard: [
                      [{ text: '👤 Мой профиль' }],
                      [{ text: '🔗 Реферальная ссылка' }], 
                      [{ text: 'ℹ️ Помощь' }],
                      [{ text: '🏆 Топ 10 лидеров' }]
                  ],
                      resize_keyboard: true
                  }
              });
              
           
          } else {
              // Если не подписан - просим подписаться
              await ctx.reply(
                  `Для доступа к боту, пожалуйста, подпишитесь на наш канал: ${process.env.CHANNEL_USERNAME}\n\n` +
                  `После подписки нажмите /start`
              );
          }
      } catch (error) {
          console.error('Start command error:', error);
          await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
      }
  });
}
