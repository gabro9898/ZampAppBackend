// src/services/challenge.service.js
import { PrismaClient } from '../../generated/prisma/index.js';
import * as repo from '../repositories/challenge.repository.js';
import * as partRepo from '../repositories/participant.repository.js';
import { GameEngineFactory } from '../games/GameEngineFactory.js';

const prisma = new PrismaClient();

export const createChallenge = async (dto) => {
  // Verifica che il gioco esista
  const game = await repo.findGameById(dto.gameId);
  if (!game) throw new Error('Game not found');
  
  // Verifica che il tipo di gioco sia supportato
  if (game.type) {
    const engine = GameEngineFactory.create(game.type, dto.gameConfig || {});
    // Valida la configurazione se necessario
  }
  
  return repo.create({
    ...dto,
    price: Number(dto.price || 0),
    prize: Number(dto.prize || 0)
  });
};

export async function joinChallenge(userId, challengeId) {
  // Logica esistente rimane uguale
  const challenge = await repo.findById(challengeId);
  if (!challenge) throw { code: 404, message: 'Challenge non trovata' };
  
  const now = new Date();
  if (now > challenge.joinDeadline) {
    throw { message: 'Iscrizioni chiuse' };
  }
  if (challenge._count.participants >= challenge.maxParticipants) {
    throw { message: 'Challenge al completo' };
  }
  
  const exists = await partRepo.find(userId, challengeId);
  if (exists) throw { message: 'Utente già iscritto' };
  
  const participant = await partRepo.create(userId, challengeId);
  await repo.incrementParticipants(challengeId);
  await partRepo.incrementUserChallenges(userId);
  
  return participant;
}

export async function getAllChallenges() {
  return repo.findAll();
}

// *** CORREZIONE: Uso il nome corretto "attempts" dal schema Prisma ***
export async function getUserChallenges(userId) {
  const participants = await prisma.participant.findMany({
    where: { userId },
    include: {
      challenge: {
        include: {
          game: true,
          _count: { select: { participants: true } }
        }
      },
      // ✅ CORRETTO: Ora uso "attempts" come definito nel schema
      attempts: {
        select: { id: true }
      }
    }
  });

  // Trasforma i dati per includere info utili
  return participants.map(p => ({
    ...p.challenge,
    score: p.score,
    rank: p.rank,
    joinedAt: p.joinedAt,
    // ✅ Ora posso contare i tentativi correttamente
    attempts: p.attempts.length,
    // Aggiungi flag per identificare che l'utente è iscritto
    participants: [{ userId }]
  }));
}

// *** CORREZIONE: Uso il nome corretto "attempts" dal schema Prisma ***
export async function getChallengeWithUserInfo(challengeId, userId) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      game: true,
      participants: {
        where: { userId },
        // ✅ CORRETTO: Ora uso "attempts" come definito nel schema
        include: {
          attempts: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      },
      _count: { select: { participants: true } }
    }
  });

  if (!challenge) throw new Error('Challenge not found');

  // Aggiungi info se l'utente è iscritto
  const isParticipating = challenge.participants.length > 0;
  const userParticipant = challenge.participants[0];

  return {
    ...challenge,
    isParticipating,
    userScore: userParticipant?.score,
    userRank: userParticipant?.rank,
    // ✅ Ora posso accedere ai tentativi correttamente
    userAttempts: userParticipant?.attempts || [],
    // Assicurati che participants contenga l'userId per il frontend
    participants: isParticipating ? [{ userId }] : []
  };
}

// ✅ AGGIORNATA: Uso il nome corretto "attempts" dal schema Prisma
export async function getUserAttemptsForChallenge(userId, challengeId) {
  try {
    // La relazione corretta è attraverso participant
    const participant = await prisma.participant.findUnique({
      where: {
        userId_challengeId: {
          userId: userId,
          challengeId: challengeId
        }
      },
      include: {
        attempts: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    return participant?.attempts || [];
  } catch (error) {
    console.log('⚠️ Errore nel recupero tentativi:', error.message);
    return [];
  }
}