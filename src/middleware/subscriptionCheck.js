
export default function createSubscriptionCheck(prisma) {
  return async (ctx, next) => {
    if (!ctx.message || !ctx.from) return next();

    const userId = ctx.from.id;

    try {
      // Проверяем подписки на канал и группу параллельно
      const [channelMember, groupMember] = await Promise.all([
        ctx.telegram.getChatMember('@indiga_test_channel', userId),
        ctx.telegram.getChatMember('@indigatestgruppa', userId)
      ]);

      // Определяем статус подписки
      const isSubscribed = (
        ['member', 'administrator', 'creator'].includes(channelMember.status) &&
        ['member', 'administrator', 'creator'].includes(groupMember.status)
      );

      // Находим или создаем пользователя
      const user = await prisma.user.upsert({
        where: { userId: BigInt(userId) },
        create: {
          userId: BigInt(userId),
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          isSubscribed
        },
        update: {
          isSubscribed
        }
      });

      // Если пользователь не подписан, можно добавить дополнительную логику
      if (!isSubscribed && ctx.message.text !== '/start') {
        await ctx.telegram.sendMessage(Number(user.userId),'Для продолжения подпишитесь на:\n' +
          '1. Канал: @indiga_test_channel\n' +
          '2. Группу: @indigatestgruppa\n\n' +
          'После подписки нажмите /start',
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Открыть канал', url: 'https://t.me/indiga_test_channel' },
                  { text: 'Открыть группу', url: 'https://t.me/indigatestgruppa' }
                ],
                [{ text: 'Я подписался', callback_data: 'check_subscription' }],
              ],
            }
          })
        
        return;
      }

      return next();
    } catch (error) {
      console.error('Subscription check error:', error);
      // Продолжаем выполнение даже при ошибке проверки
      return next();
    }
  };
}