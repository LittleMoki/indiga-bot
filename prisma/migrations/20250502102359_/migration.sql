/*
  Warnings:

  - You are about to drop the column `userId` on the `referrals` table. All the data in the column will be lost.
  - You are about to drop the column `referrerId` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_userId_fkey";

-- AlterTable
ALTER TABLE "referrals" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "referrerId";

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
