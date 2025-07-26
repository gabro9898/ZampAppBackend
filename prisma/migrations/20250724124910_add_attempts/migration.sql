-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "participantChallengeId" TEXT NOT NULL,
    "elapsedMillis" INTEGER NOT NULL,
    "diffMillis" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attempt_participantUserId_participantChallengeId_idx" ON "Attempt"("participantUserId", "participantChallengeId");

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_participantUserId_participantChallengeId_fkey" FOREIGN KEY ("participantUserId", "participantChallengeId") REFERENCES "Participant"("userId", "challengeId") ON DELETE RESTRICT ON UPDATE CASCADE;
