export async function generateReferralLink(ctx) {
    return `https://t.me/${ctx.botInfo.username}?start=${ctx.from.id}`;
  }
  
  export async function handleReferral(ctx, prisma) {
    if (!ctx.message || !('text' in ctx.message) || !ctx.from) return;
  
    const messageText = ctx.message.text;
    const referrerId = messageText.split(' ')[1];
    const userId = ctx.from.id;
  
    // Проверяем валидность реферального кода
    if (!referrerId || referrerId === String(userId)) return;
  
    try {
      // Проверяем существование реферера
      const referrerExists = await prisma.user.findUnique({
        where: { userId: BigInt(referrerId) }
      });
      if (!referrerExists) return;
  
      // Проверяем, не регистрировался ли уже пользователь по реферальной ссылке
      const existingReferral = await prisma.referral.findUnique({
        where: { referredId: BigInt(userId) }
      });
      if (existingReferral) return;
  
      // Создаем запись о реферале
      await prisma.referral.create({
        data: {
          referrerId: BigInt(referrerId),
          referredId: BigInt(userId),
          bonusGiven: true
        }
      });
  
      // Начисляем балл рефереру
      await prisma.user.update({
        where: { userId: BigInt(referrerId) },
        data: { 
          points: { increment: 1 },
          referrals: { connect: { referredId: BigInt(userId) } }
        }
      });
  
      console.log(`Начислен балл за реферала: ${userId} -> ${referrerId}`);
    } catch (error) {
      console.error('Referral processing error:', error);
    }
  }