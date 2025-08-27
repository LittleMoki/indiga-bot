export async function generateReferralLink(ctx) {
	return `https://t.me/${ctx.botInfo.username}?start=${ctx.from.id}`
}

export async function handleReferral(ctx, prisma) {
	if (!ctx.message?.text || !ctx.from) return

	const messageText = ctx.message.text
	const referrerId = messageText.split(' ')[1]
	const userId = ctx.from.id

	// Валидация реферального кода
	if (!referrerId || referrerId === String(userId)) return

	try {
		// Проверка существования реферера
		const referrerExists = await prisma.user.findUnique({
			where: { userId: Number(referrerId) },
		})
		if (!referrerExists) return

		// Проверка на дублирование
		const existingReferral = await prisma.referral.findUnique({
			where: { referredId: Number(userId) },
		})
		if (existingReferral) return

		// Транзакция для атомарного обновления
		await prisma.$transaction([
			prisma.referral.create({
				data: {
					referrerId: BigInt(referrerId),
					referredId: BigInt(userId),
					bonusGiven: true,
				},
			}),
			prisma.user.update({
				where: { userId: BigInt(referrerId) },
				data: { points: { increment: 1 } },
			}),
		])

		// console.log(`Начислен балл за реферала: ${userId} -> ${referrerId}`)
	} catch (error) {
		console.error('Referral processing error:', error)
	}
}
