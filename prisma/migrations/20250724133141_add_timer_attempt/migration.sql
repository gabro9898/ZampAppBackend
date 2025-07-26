/*
  Warnings:

  - You are about to drop the `Attempt` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_participantUserId_participantChallengeId_fkey";

-- DropTable
DROP TABLE "Attempt";

-- CreateTable
CREATE TABLE "TimerAttempt" (
    "id" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "participantChallengeId" TEXT NOT NULL,
    "elapsedMillis" INTEGER NOT NULL,
    "diffMillis" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimerAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimerAttempt_participantUserId_participantChallengeId_idx" ON "TimerAttempt"("participantUserId", "participantChallengeId");

-- AddForeignKey
ALTER TABLE "TimerAttempt" ADD CONSTRAINT "TimerAttempt_participantUserId_participantChallengeId_fkey" FOREIGN KEY ("participantUserId", "participantChallengeId") REFERENCES "Participant"("userId", "challengeId") ON DELETE RESTRICT ON UPDATE CASCADE;
