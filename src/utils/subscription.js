export async function checkSubscription(ctx) {
	try {
		const [channelMember] = await Promise.all([
			ctx.telegram.getChatMember('@indiga_group', ctx.from.id)
		])

		const isChannelSubscribed = ['member', 'administrator', 'creator'].includes(
			channelMember.status
		)
		return isChannelSubscribed 
	} catch (error) {
		console.error('Subscription check error:', error)
		return false
	}
}
