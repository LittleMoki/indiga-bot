import { setupRefferalHandler } from './refferalAction.js'
import { setupSubscriptionHandler } from './subscription.js'

export function setupHandlers(bot, prisma) {
	setupSubscriptionHandler(bot, prisma)
	setupRefferalHandler(bot, prisma)
	// сюда потом добавишь другие handlers (например, команды, меню и т.д.)
}
