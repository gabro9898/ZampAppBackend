// src/services/timerAttempt.service.js

import * as repo from '../repositories/gameAttempt.repository.js';
import * as challengeRepo from '../repositories/challenge.repository.js';
import { GameEngineFactory } from '../games/GameEngineFactory.js';
import { AttemptValidationService } from './attemptValidation.service.js';
import { PrismaClient } from '../../generated/prisma/index.js';
import { UserProgressionService } from './userProgression.service.js';

const prisma = new PrismaClient();

export async function save(userId, challengeId, attemptData) {
  // 1. Verifica se può fare il tentativo
  const validation = await AttemptValidationService.canMakeAttempt(userId, challengeId);
  
  if (!validation.canAttempt) {
    throw new Error(`Cannot make attempt: ${validation.reason}. Next attempt available at: ${validation.nextAttemptAt}`);
  }

  // 2. Verifica iscrizione
  const participant = await prisma.participant.findUnique({
    where: { userId_challengeId: { userId, challengeId } },
    include: { challenge: { include: { game: true } } }
  });
  
  if (!participant) {
    throw new Error('Utente non iscritto alla challenge');
  }

  // 3. Ottieni il motore di gioco e calcola il punteggio
  const gameEngine = GameEngineFactory.create(
    participant.challenge.game.type || 'timer',
    participant.challenge.gameConfig || {}
  );
  
  // 4. Valida e calcola
  gameEngine.validateAttempt(attemptData);
  const scoreData = gameEngine.calculateScore(attemptData);
  
  // 5. Salva il tentativo con attemptDate corrente
  const attempt = await repo.create({
    userId,
    challengeId,
    elapsedMillis: scoreData.elapsedMillis,
    diffMillis: scoreData.diffMillis,
    attemptDate: new Date()
  });
  
  // 6. Aggiorna il miglior punteggio del partecipante (logica giornaliera)
  await updateParticipantBestScore(userId, challengeId, scoreData.score, participant.challenge.game.resetTime);

  // 7. Aggiorna progressione utente
  const isFirstToday = await UserProgressionService.isFirstAttemptToday(userId);
  await UserProgressionService.updateAfterAttempt(userId, challengeId, isFirstToday);

  // 8. Restituisci risultato completo
  return {
    ...attempt,
    ...scoreData,
    validation: {
      attemptsToday: validation.attemptsToday + 1,
      maxAttempts: validation.maxAttempts,
      resetTime: validation.resetTime
    }
  };
}

async function updateParticipantBestScore(userId, challengeId, newScore, resetTime) {
  const participant = await prisma.participant.findUnique({
    where: { userId_challengeId: { userId, challengeId } }
  });

  if (participant.score === 0 || newScore < participant.score) {
    await prisma.participant.update({
      where: { userId_challengeId: { userId, challengeId } },
      data: { score: newScore }
    });
  }
}

export async function leaderboard(challengeId) {
  const participants = await prisma.participant.findMany({
    where: { challengeId },
    orderBy: { score: 'asc' },
    include: { 
      user: { select: { firstName: true, lastName: true } },
      gameAttempt: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });

  return participants.map((participant, i) => ({
    rank: i + 1,
    userId: participant.userId,
    name: `${participant.user.firstName} ${participant.user.lastName}`,
    bestScore: participant.score,
    totalAttempts: participant.gameAttempt.length,
    lastAttempt: participant.gameAttempt[0]?.createdAt || participant.joinedAt
  }));
}

export async function getDailyLeaderboard(challengeId, date = new Date()) {
  const challenge = await challengeRepo.findById(challengeId);
  if (!challenge) throw new Error('Challenge not found');

  const resetTime = challenge.game?.resetTime || "00:00";

  const dayRange = DateUtils.getTodayRange(resetTime);
  if (date) {
    const [hours, minutes] = resetTime.split(':').map(Number);
    dayRange.start = new Date(date);
    dayRange.start.setHours(hours, minutes, 0, 0);
    dayRange.end = new Date(dayRange.start);
    dayRange.end.setDate(dayRange.end.getDate() + 1);
    dayRange.end.setMilliseconds(-1);
  }

  const dailyBests = await prisma.$queryRaw`
    SELECT 
      "participantUserId",
      MIN("diffMillis") as "bestDailyScore",
      COUNT(*) as "attemptsToday"
    FROM "gameAttempt" 
    WHERE "participantChallengeId" = ${challengeId}
      AND "attemptDate" >= ${dayRange.start}
      AND "attemptDate" <= ${dayRange.end}
    GROUP BY "participantUserId"
    ORDER BY "bestDailyScore" ASC
  `;

  return Promise.all(dailyBests.map(async (row, i) => {
    const user = await prisma.user.findUnique({
      where: { id: row.participantUserId },
      select: { firstName: true, lastName: true }
    });

    return {
      rank: i + 1,
      userId: row.participantUserId,
      name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      bestDailyScore: row.bestDailyScore,
      attemptsToday: row.attemptsToday,
      date: date
    };
  }));
  }