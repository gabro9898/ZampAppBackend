-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "packageType" TEXT NOT NULL,
    "packageExpiresAt" TIMESTAMP(3) NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedDate" TIMESTAMP(3),
    "challengesPlayed" INTEGER NOT NULL DEFAULT 0,
    "prizesWon" INTEGER NOT NULL DEFAULT 0,
    "prizesValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "attemptFrequency" TEXT DEFAULT 'daily',
    "maxAttemptsPerDay" INTEGER DEFAULT 1,
    "resetTime" TEXT DEFAULT '00:00',
    "gameConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gameId" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "prize" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "joinDeadline" TIMESTAMP(3) NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "rules" TEXT,
    "visibility" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("userId","challengeId")
);

-- CreateTable
CREATE TABLE "GameAttempt" (
    "id" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "participantChallengeId" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "attemptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "GameAttempt_participantUserId_participantChallengeId_idx" ON "GameAttempt"("participantUserId", "participantChallengeId");

-- CreateIndex
CREATE INDEX "GameAttempt_participantUserId_participantChallengeId_attemp_idx" ON "GameAttempt"("participantUserId", "participantChallengeId", "attemptDate");

-- CreateIndex
CREATE INDEX "GameAttempt_gameType_score_idx" ON "GameAttempt"("gameType", "score");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_participantUserId_participantChallengeId_fkey" FOREIGN KEY ("participantUserId", "participantChallengeId") REFERENCES "Participant"("userId", "challengeId") ON DELETE RESTRICT ON UPDATE CASCADE;
