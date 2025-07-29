-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "pricesByPackage" JSONB;

-- CreateTable
CREATE TABLE "PurchasedChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pricePaid" DECIMAL(65,30) NOT NULL,
    "paymentMethod" TEXT,
    "transactionId" TEXT,

    CONSTRAINT "PurchasedChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchasedChallenge_userId_idx" ON "PurchasedChallenge"("userId");

-- CreateIndex
CREATE INDEX "PurchasedChallenge_challengeId_idx" ON "PurchasedChallenge"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasedChallenge_userId_challengeId_key" ON "PurchasedChallenge"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "PurchasedChallenge" ADD CONSTRAINT "PurchasedChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasedChallenge" ADD CONSTRAINT "PurchasedChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
