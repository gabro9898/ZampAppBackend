// src/controllers/gameAttempt.controller.js - Controller Completo e Aggiornato

import { PrismaClient } from '../../generated/prisma/index.js';
import { GameEngineFactory } from '../games/GameEngineFactory.js';
import { serializeData } from '../utils/serializer.js';

const prisma = new PrismaClient();

/**
 * Crea un nuovo tentativo di gioco
 * @route POST /api/challenges/:id/timer/attempt
 */
export async function create(req, res) {
  try {
    const { id: challengeId } = req.params;
    const userId = req.user.id;
    const attemptData = req.body;

    console.log('🎮 Creating game attempt:', { challengeId, userId, attemptData });

    // 1. Verifica che l'utente sia iscritto e possa giocare
    const participant = await prisma.participant.findUnique({
      where: {
        userId_challengeId: { userId, challengeId }
      },
      include: {
        challenge: {
          include: { game: true }
        }
      }
    });

    if (!participant) {
      return res.status(403).json({ 
        error: 'Devi essere iscritto alla challenge per giocare' 
      });
    }

    const challenge = participant.challenge;
    const game = challenge.game;

    // 2. Verifica che la challenge sia attiva
    const now = new Date();
    if (now < challenge.startDate || now > challenge.endDate) {
      return res.status(400).json({ 
        error: 'La challenge non è attiva' 
      });
    }

    // 3. Verifica il limite di tentativi giornalieri
    const resetTime = game.resetTime || '00:00';
    const [resetHour, resetMinute] = resetTime.split(':').map(Number);
    
    const startOfPeriod = new Date(now);
    startOfPeriod.setHours(resetHour, resetMinute, 0, 0);
    
    if (now < startOfPeriod) {
      startOfPeriod.setDate(startOfPeriod.getDate() - 1);
    }
    
    const endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setDate(endOfPeriod.getDate() + 1);

    const todayAttemptsCount = await prisma.gameAttempt.count({
      where: {
        participantUserId: userId,
        participantChallengeId: challengeId,
        attemptDate: {
          gte: startOfPeriod,
          lt: endOfPeriod
        }
      }
    });

    const maxAttemptsPerDay = game.maxAttemptsPerDay || 1;
    if (todayAttemptsCount >= maxAttemptsPerDay) {
      return res.status(429).json({ 
        error: 'Hai raggiunto il limite di tentativi per oggi',
        nextResetTime: endOfPeriod
      });
    }

    // 4. Usa il game engine per validare e calcolare il punteggio
    const gameConfig = game.gameConfig || {};
    const engine = GameEngineFactory.create(game.type, gameConfig);
    
    try {
      engine.validateAttempt(attemptData);
    } catch (validationError) {
      return res.status(400).json({ 
        error: validationError.message 
      });
    }

    const scoreData = engine.calculateScore(attemptData);

    // 5. Salva il tentativo
    const gameAttempt = await prisma.gameAttempt.create({
      data: {
        participantUserId: userId,
        participantChallengeId: challengeId,
        gameType: game.type,
        score: scoreData.score,
        gameData: {
          ...scoreData,
          ...attemptData,
          timestamp: new Date()
        }
      }
    });

    // 6. Aggiorna il punteggio del partecipante se è il migliore
    const bestScore = await prisma.gameAttempt.aggregate({
      where: {
        participantUserId: userId,
        participantChallengeId: challengeId
      },
      _min: {
        score: true
      }
    });

    if (bestScore._min.score === scoreData.score) {
      await prisma.participant.update({
        where: {
          userId_challengeId: { userId, challengeId }
        },
        data: {
          score: scoreData.score
        }
      });
    }

    // 7. Aggiorna le statistiche dell'utente
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: 10 }, // Base XP per tentativo
        lastPlayedDate: new Date()
      }
    });

    // ✅ CORREZIONE: Serializza i dati prima di inviarli
    const response = serializeData({
      success: true,
      attempt: gameAttempt,
      scoreDetails: scoreData,
      isNewBest: bestScore._min.score === scoreData.score,
      attemptsToday: todayAttemptsCount + 1,
      remainingAttempts: maxAttemptsPerDay - (todayAttemptsCount + 1)
    });

    console.log('✅ Game attempt created successfully');
    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Error creating game attempt:', error);
    res.status(500).json({ 
      error: 'Errore nella creazione del tentativo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Ottieni la classifica generale della challenge
 * @route GET /api/challenges/:id/timer/leaderboard
 */
export async function leaderboard(req, res) {
  try {
    const { id: challengeId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    console.log('🏆 Fetching leaderboard:', { challengeId, limit, offset });

    // Verifica che la challenge esista
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { game: true }
    });

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge non trovata' });
    }

    // Ottieni la classifica aggregata (miglior punteggio per utente)
    const leaderboardData = await prisma.$queryRaw`
      SELECT 
        p."userId",
        u."firstName",
        u."lastName",
        MIN(ga."score") as "bestScore",
        COUNT(ga."id") as "totalAttempts",
        MAX(ga."createdAt") as "lastAttempt",
        RANK() OVER (ORDER BY MIN(ga."score") ASC) as "rank"
      FROM "Participant" p
      INNER JOIN "User" u ON u."id" = p."userId"
      INNER JOIN "GameAttempt" ga ON 
        ga."participantUserId" = p."userId" AND 
        ga."participantChallengeId" = p."challengeId"
      WHERE p."challengeId" = ${challengeId}
      GROUP BY p."userId", u."firstName", u."lastName"
      ORDER BY "bestScore" ASC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    // Conta il totale dei partecipanti
    const totalParticipants = await prisma.participant.count({
      where: { challengeId }
    });

    // Se l'utente è autenticato, trova la sua posizione
    let userRank = null;
    if (req.user) {
      const userStatsResult = await prisma.$queryRaw`
        SELECT 
          MIN(ga."score") as "bestScore",
          RANK() OVER (ORDER BY MIN(ga."score") ASC) as "rank"
        FROM "Participant" p
        INNER JOIN "GameAttempt" ga ON 
          ga."participantUserId" = p."userId" AND 
          ga."participantChallengeId" = p."challengeId"
        WHERE p."challengeId" = ${challengeId}
          AND p."userId" = ${req.user.id}
        GROUP BY p."userId"
      `;
      
      if (userStatsResult.length > 0) {
        userRank = userStatsResult[0];
      }
    }

    // ✅ CORREZIONE: Serializza i dati prima di inviarli
    const response = serializeData({
      challenge: {
        id: challenge.id,
        name: challenge.name,
        gameType: challenge.game.type
      },
      leaderboard: leaderboardData,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalParticipants
      },
      userRank
    });

    console.log('📊 Leaderboard data serialized successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ 
      error: 'Errore nel recupero della classifica',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Ottieni la classifica giornaliera
 * @route GET /api/challenges/:id/timer/daily-leaderboard?date=2025-07-27
 */
export async function dailyLeaderboard(req, res) {
  try {
    const { id: challengeId } = req.params;
    const { date, limit = 50, offset = 0 } = req.query;

    console.log('🏆 Fetching daily leaderboard:', { challengeId, date, limit, offset });

    // Usa la data fornita o oggi
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Verifica che la challenge esista
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { game: true }
    });

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge non trovata' });
    }

    // Classifica giornaliera
    const dailyLeaderboardData = await prisma.$queryRaw`
      SELECT 
        p."userId",
        u."firstName",
        u."lastName",
        MIN(ga."score") as "bestScore",
        COUNT(ga."id") as "attempts",
        json_agg(
          json_build_object(
            'score', ga."score",
            'time', ga."createdAt",
            'data', ga."gameData"
          ) ORDER BY ga."score" ASC
        ) as "attemptDetails",
        RANK() OVER (ORDER BY MIN(ga."score") ASC) as "rank"
      FROM "Participant" p
      INNER JOIN "User" u ON u."id" = p."userId"
      INNER JOIN "GameAttempt" ga ON 
        ga."participantUserId" = p."userId" AND 
        ga."participantChallengeId" = p."challengeId"
      WHERE p."challengeId" = ${challengeId}
        AND ga."attemptDate" >= ${targetDate}
        AND ga."attemptDate" < ${nextDay}
      GROUP BY p."userId", u."firstName", u."lastName"
      ORDER BY "bestScore" ASC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    // ✅ CORREZIONE: Serializza i dati prima di inviarli
    const response = serializeData({
      challenge: {
        id: challenge.id,
        name: challenge.name,
        gameType: challenge.game.type
      },
      date: targetDate,
      leaderboard: dailyLeaderboardData,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

    console.log('📊 Daily leaderboard data serialized successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching daily leaderboard:', error);
    res.status(500).json({ 
      error: 'Errore nel recupero della classifica giornaliera',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Verifica se l'utente può giocare alla challenge timer
 * @route GET /api/challenges/:id/timer/status
 */
export async function checkAttemptStatus(req, res) {
  try {
    const { id: challengeId } = req.params;
    const userId = req.user.id;

    console.log('🔍 Checking attempt status:', { challengeId, userId });

    // 1. Verifica iscrizione con una singola query
    const participant = await prisma.participant.findUnique({
      where: {
        userId_challengeId: { userId, challengeId }
      },
      include: {
        challenge: {
          include: { game: true }
        }
      }
    });

    // Se non è iscritto
    if (!participant) {
      return res.status(403).json({ 
        error: 'Non sei iscritto a questa challenge',
        canPlay: false,
        needsRegistration: true
      });
    }

    const challenge = participant.challenge;
    const game = challenge.game;

    // 2. Verifica che la challenge sia attiva
    const now = new Date();
    if (now < challenge.startDate) {
      return res.status(400).json({
        error: 'La challenge non è ancora iniziata',
        canPlay: false,
        startsAt: challenge.startDate
      });
    }

    if (now > challenge.endDate) {
      return res.status(400).json({
        error: 'La challenge è terminata',
        canPlay: false,
        endedAt: challenge.endDate
      });
    }

    // 3. Calcola il periodo di reset (default: giornaliero)
    const resetTime = game.resetTime || '00:00';
    const [resetHour, resetMinute] = resetTime.split(':').map(Number);
    
    // Calcola l'inizio del periodo corrente
    const startOfPeriod = new Date(now);
    startOfPeriod.setHours(resetHour, resetMinute, 0, 0);
    
    // Se siamo prima dell'ora di reset, il periodo è iniziato ieri
    if (now < startOfPeriod) {
      startOfPeriod.setDate(startOfPeriod.getDate() - 1);
    }
    
    // Calcola la fine del periodo corrente
    const endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setDate(endOfPeriod.getDate() + 1);

    // 4. Ottieni i tentativi del periodo corrente con aggregazione
    const attemptStatsResult = await prisma.gameAttempt.groupBy({
      by: ['participantUserId', 'participantChallengeId'],
      where: {
        participantUserId: userId,
        participantChallengeId: challengeId,
        attemptDate: {
          gte: startOfPeriod,
          lt: endOfPeriod
        }
      },
      _count: {
        id: true
      },
      _min: {
        score: true
      }
    });

    const attemptStats = attemptStatsResult.length > 0 ? attemptStatsResult[0] : null;
    const todayAttemptsCount = attemptStats?._count?.id || 0;
    const todayBestScore = attemptStats?._min?.score || null;

    // 5. Se ha giocato oggi, prendi i dettagli del miglior tentativo
    let bestAttemptDetails = null;
    if (todayBestScore !== null) {
      bestAttemptDetails = await prisma.gameAttempt.findFirst({
        where: {
          participantUserId: userId,
          participantChallengeId: challengeId,
          score: todayBestScore,
          attemptDate: {
            gte: startOfPeriod,
            lt: endOfPeriod
          }
        }
      });
    }

    // 6. Determina se può giocare
    const maxAttemptsPerDay = game.maxAttemptsPerDay || 1;
    const canPlay = todayAttemptsCount < maxAttemptsPerDay;

    // 7. Calcola statistiche aggiuntive
    const remainingAttempts = Math.max(0, maxAttemptsPerDay - todayAttemptsCount);
    const nextResetDate = new Date(endOfPeriod);

    // 8. Prepara la risposta completa
    const response = {
      canPlay,
      status: {
        attemptsToday: todayAttemptsCount,
        maxAttemptsPerDay,
        remainingAttempts,
        periodStart: startOfPeriod,
        periodEnd: endOfPeriod,
        nextResetTime: resetTime,
        nextResetDate
      },
      todayBest: null,
      message: generateMessage(canPlay, remainingAttempts, nextResetDate)
    };

    // Aggiungi dettagli del miglior tentativo se esiste
    if (bestAttemptDetails?.gameData) {
      const gameData = bestAttemptDetails.gameData;
      response.todayBest = {
        score: bestAttemptDetails.score,
        diffMillis: gameData.diffMillis || null,
        elapsedMillis: gameData.elapsedMillis || null,
        accuracy: gameData.accuracy || null,
        attemptedAt: bestAttemptDetails.createdAt
      };
    }

    // ✅ CORREZIONE: Serializza i dati prima di inviarli
    const serializedResponse = serializeData(response);

    console.log('✅ Attempt status checked successfully');
    res.json(serializedResponse);

  } catch (error) {
    console.error('❌ Error checking attempt status:', error);
    res.status(500).json({ 
      error: 'Errore nel controllo dello stato',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Genera un messaggio user-friendly basato sullo stato
 */
function generateMessage(canPlay, remainingAttempts, nextResetDate) {
  if (canPlay) {
    if (remainingAttempts === 1) {
      return 'Hai un ultimo tentativo per oggi. Gioca con attenzione!';
    }
    return `Puoi giocare! Hai ancora ${remainingAttempts} tentativi disponibili.`;
  }
  
  // Formatta l'ora del prossimo reset
  const hours = nextResetDate.getHours().toString().padStart(2, '0');
  const minutes = nextResetDate.getMinutes().toString().padStart(2, '0');
  
  // Se il reset è domani
  if (nextResetDate.getDate() !== new Date().getDate()) {
    return `Hai esaurito i tentativi per oggi. Torna domani alle ${hours}:${minutes}!`;
  }
  
  return `Hai esaurito i tentativi. Potrai giocare di nuovo alle ${hours}:${minutes}.`;
}

/**
 * Metodo helper per ottenere solo lo stato base (versione leggera)
 * @route GET /api/challenges/:id/timer/quick-status
 */
export async function quickCheckCanPlay(req, res) {
  try {
    const { id: challengeId } = req.params;
    const userId = req.user.id;

    console.log('⚡ Quick status check:', { challengeId, userId });

    // Query ottimizzata solo per verificare se può giocare
    const result = await prisma.$queryRaw`
      SELECT 
        COUNT(ga.id) as attempts_count,
        g."maxAttemptsPerDay" as max_attempts
      FROM "Participant" p
      INNER JOIN "Challenge" c ON c.id = p."challengeId"
      INNER JOIN "Game" g ON g.id = c."gameId"
      LEFT JOIN "GameAttempt" ga ON 
        ga."participantUserId" = p."userId" AND 
        ga."participantChallengeId" = p."challengeId" AND
        ga."attemptDate" >= CURRENT_DATE
      WHERE 
        p."userId" = ${userId} AND 
        p."challengeId" = ${challengeId}
      GROUP BY g."maxAttemptsPerDay"
    `;

    if (!result || result.length === 0) {
      return res.json({ canPlay: false, registered: false });
    }

    const { attempts_count, max_attempts } = result[0];
    const canPlay = Number(attempts_count) < (Number(max_attempts) || 1);

    // ✅ CORREZIONE: Serializza i dati prima di inviarli
    const response = serializeData({ canPlay, registered: true });

    console.log('✅ Quick status checked successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Quick check error:', error);
    res.status(500).json({ canPlay: false, error: true });
  }
}