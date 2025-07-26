-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "attemptFrequency" TEXT,
ADD COLUMN     "maxAttemptsPerPeriod" INTEGER,
ADD COLUMN     "resetTime" TEXT DEFAULT '00:00';
