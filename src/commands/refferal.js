export default function referralCommand(bot, prisma) {
    bot.hears('🔗 Реферальная ссылка', async (ctx) => {
        const referralLink = await generateReferralLink(ctx);
        await ctx.reply(
          `Ваша реферальная ссылка:\n${referralLink}\n\n` +
          `За каждого приглашенного друга вы получите 1 балл!`
        );
      });
}