export function privateChatOnly(ctx, next) {
	if (ctx.chat?.type !== 'private') {
		return
	}
	return next()
}
