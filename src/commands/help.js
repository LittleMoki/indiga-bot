export default function helpCommand(bot) {
	bot.hears('ℹ️ Yordam', async ctx => {
		try {
			await ctx.reply(`🆘 Yordam kerakmi? \n\n👉 @nurullayev_me`)
		} catch (error) {
			console.error('Help error:', error)
			await ctx.reply("Xatolik yuz berdi. Iltimos, keyinroq urunib ko'ring.")
		}
	})
}
