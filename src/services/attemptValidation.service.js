// src/services/attemptValidation.service.js
import { DateUtils } from '../utils/dateUtils.js';
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

export class AttemptValidationService {
  
  /**
   * Verifica se l'utente può fare un tentativo oggi
   */
  static async canMakeAttempt(userId, challengeId) {
    // 1. Ottieni la challenge con il game
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { game: true }
    });

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    // 2. Verifica che la challenge sia attiva
    const now = new Date();
    if (now < challenge.startDate) {
      return {
        canAttempt: false,
        reason: 'Challenge not started yet',
        nextAttemptAt: challenge.startDate
      };
    }

    if (now > challenge.endDate) {
      return {
        canAttempt: false,
        reason: 'Challenge has ended',
        nextAttemptAt: null
      };
    }

    // 3. Controlla i limiti giornalieri del game
    const maxAttempts = challenge.game.maxAttemptsPerDay || 1;
    const resetTime = challenge.game.resetTime || "00:00";

    // 4. Ottieni il range di "oggi" basato su resetTime
    const todayRange = DateUtils.getTodayRange(resetTime);

    // 5. Conta i tentativi di oggi
    const todayAttempts = await prisma.gameAttempt.count({
      where: {
        participantUserId: userId,
        participantChallengeId: challengeId,
        attemptDate: {
          gte: todayRange.start,
          lte: todayRange.end
        }
      }
    });

    // 6. Verifica se ha raggiunto il limite
    if (todayAttempts >= maxAttempts) {
      const nextResetTime = DateUtils.getNextResetTime(resetTime);
      
      return {
        canAttempt: false,
        reason: `Daily limit reached (${todayAttempts}/${maxAttempts})`,
        nextAttemptAt: nextResetTime,
        attemptsToday: todayAttempts,
        maxAttempts: maxAttempts
      };
    }

    // 7. Può fare il tentativo!
    return {
      canAttempt: true,
      attemptsToday: todayAttempts,
      maxAttempts: maxAttempts,
      resetTime: resetTime
    };
  }

  /**
   * Ottiene statistiche sui tentativi dell'utente
   */
  static async getUserAttemptStats(userId, challengeId) {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { game: true }
    });

    if (!challenge) return null;

    const resetTime = challenge.game.resetTime || "00:00";
    const todayRange = DateUtils.getTodayRange(resetTime);

    // Tentativi totali
    const totalAttempts = await prisma.gameAttempt.count({
      where: {
        participantUserId: userId,
        participantChallengeId: challengeId
      }
    });

    // Tentativi di oggi
    const todayAttempts = await prisma.gameAttempt.count({
      where: {
        participantUserId: userId,
        participantChallengeId: challengeId,
        attemptDate: {
          gte: todayRange.start,
          lte: todayRange.end
        }
      }
    });

    // Miglior tentativo di oggi
    const bestTodayAttempt = await prisma.gameAttempt.findFirst({
      where: {
        participantUserId: userId,
        participantChallengeId: challengeId,
        attemptDate: {
          gte: todayRange.start,
          lte: todayRange.end
        }
      },
      orderBy: { diffMillis: 'asc' }
    });

    // Miglior tentativo assoluto
    const bestOverallAttempt = await prisma.gameAttempt.findFirst({
      where: {
        participantUserId: userId,
        participantChallengeId: challengeId
      },
      orderBy: { diffMillis: 'asc' }
    });

    return {
      totalAttempts,
      todayAttempts,
      maxAttemptsPerDay: challenge.game.maxAttemptsPerDay || 1,
      bestToday: bestTodayAttempt?.diffMillis || null,
      bestOverall: bestOverallAttempt?.diffMillis || null,
      resetTime
    };
  }
}
