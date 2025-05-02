export default function createSubscriptionCheck(prisma) {
    return async (ctx, next) => {
      if (!ctx.message || !ctx.from) return next();
  
      const userId = ctx.from.id;
  
      try {
        const user = await prisma.user.findUnique({
          where: { userId: BigInt(userId) }
        });
  
        if (!user) return next();
  
        const member = await ctx.telegram.getChatMember(
          process.env.CHANNEL_USERNAME,
          userId
        );
  
        const isSubscribed = ['member', 'administrator', 'creator'].includes(member.status);
  
        if (user.isSubscribed !== isSubscribed) {
          await prisma.user.update({
            where: { userId: BigInt(userId) },
            data: { isSubscribed }
          });
        }
  
        return next();
      } catch (error) {
        console.error('Subscription check error:', error);
        return next();
      }
    };
  }