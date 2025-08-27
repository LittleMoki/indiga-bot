export async function checkSubscription(ctx) {
	try {
		const [channelMember, groupMember] = await Promise.all([
			ctx.telegram.getChatMember('@indiga_test_channel', ctx.from.id),
			ctx.telegram.getChatMember('@indigatestgruppa', ctx.from.id),
		])

		const isChannelSubscribed = ['member', 'administrator', 'creator'].includes(
			channelMember.status
		)
		const isGroupSubscribed = ['member', 'administrator', 'creator'].includes(
			groupMember.status
		)

		return isChannelSubscribed && isGroupSubscribed
	} catch (error) {
		console.error('Subscription check error:', error)
		return false
	}
}
