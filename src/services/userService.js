export async function upsertUser(prisma, ctx, isSubscribed) {
	return prisma.user.upsert({
		where: { userId: BigInt(ctx.from.id) },
		create: {
			userId: BigInt(ctx.from.id),
			username: ctx.from.username,
			firstName: ctx.from.first_name,
			isSubscribed,
		},
		update: {
			isSubscribed,
		},
	})
}
