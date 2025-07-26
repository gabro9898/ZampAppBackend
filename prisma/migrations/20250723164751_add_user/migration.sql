-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "packageType" TEXT NOT NULL,
    "packageExpiresAt" TIMESTAMP(3) NOT NULL,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "challengesPlayed" INTEGER NOT NULL DEFAULT 0,
    "prizesWon" INTEGER NOT NULL DEFAULT 0,
    "prizesValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
