// src/repositories/gameAttempt.repository.js
import { PrismaClient } from '../../generated/prisma/index.js';
const prisma = new PrismaClient();

// Crea un tentativo generico (qualsiasi gioco)
export const create = ({
  participantUserId,
  participantChallengeId,
  gameType,
  score,
  gameData,
  attemptDate,
}) =>
  prisma.gameAttempt.create({
    data: {
      participantUserId,
      participantChallengeId,
      gameType,
      score,
      gameData,
      attemptDate: attemptDate || new Date(),
    },
  });

// Classifica aggregata (usata per leaderboard generica)
export const leaderboard = (challengeId) =>
  prisma.gameAttempt.groupBy({
    by: ['participantUserId'],
    where: { participantChallengeId: challengeId },
    _min: { score: true },
    orderBy: { _min: { score: 'asc' } },
  });

// Conta tentativi utente in un range
export const countByUserInRange = (userId, challengeId, start, end) =>
  prisma.gameAttempt.count({
    where: {
      participantUserId:      userId,
      participantChallengeId: challengeId,
      attemptDate:            { gte: start, lte: end },
    },
  });

// Miglior tentativo utente in un range
export const bestByUserInRange = (userId, challengeId, start, end) =>
  prisma.gameAttempt.findFirst({
    where: {
      participantUserId:      userId,
      participantChallengeId: challengeId,
      attemptDate:            { gte: start, lte: end },
    },
    orderBy: { score: 'asc' },
  });