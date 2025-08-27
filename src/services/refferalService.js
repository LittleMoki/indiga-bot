import { generateReferralLink } from '../utils/referralUtils.js'

export async function sendReferralInfo(ctx, prisma, edit = false) {
	const referralLink = await generateReferralLink(ctx)
	const user = await prisma.user.findUnique({
		where: { userId: Number(ctx.from.id) },
		include: { _count: { select: { referrals: true } } },
	})

	const text =
		`🎁 *Doʻstingizni taklif qiling* \n\n` +
		`Do‘stlaringizni taklif qiling va ballar to‘plang! \n\n` +
		`👥 Taklif qilinganlar: ${user?._count?.referrals || 0} kishi \n` +
		`⭐ Ballaringiz: ${user?.points || 0}\n\n` +
		`🔗 Sizning havolangiz: \n${referralLink}`

	if (edit && ctx.callbackQuery?.message) {
		await ctx.editMessageText(text, { parse_mode: 'Markdown' })
	} else {
		await ctx.reply(text, { parse_mode: 'Markdown' })
	}
}
