// src/repositories/timerAttempt.repository.js (AGGIORNATO)
import { PrismaClient } from '../../generated/prisma/index.js';
const prisma = new PrismaClient();

export const create = ({ userId, challengeId, elapsedMillis, diffMillis, attemptDate }) =>
  prisma.timerAttempt.create({
    data: {
      participantUserId: userId,
      participantChallengeId: challengeId,
      elapsedMillis,
      diffMillis,
      attemptDate: attemptDate || new Date() // Se non specificato, usa ora
    }
  });

export const leaderboard = (challengeId) =>
  prisma.timerAttempt.groupBy({
    by: ['participantUserId'],
    where: { participantChallengeId: challengeId },
    _sum: { diffMillis: true },
    orderBy: { _sum: { diffMillis: 'asc' } }
  });

// Trova tentativi per utente in un range di date
export const findByUserAndDateRange = (userId, challengeId, startDate, endDate) =>
  prisma.timerAttempt.findMany({
    where: {
      participantUserId: userId,
      participantChallengeId: challengeId,
      attemptDate: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { attemptDate: 'desc' }
  });