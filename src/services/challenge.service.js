// src/services/challenge.service.js - Versione COMPLETA con fix per challenge paid
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

// ✨ FUNZIONE AGGIORNATA con verifica acquisto per challenge paid
export async function joinChallenge(userId, challengeId) {
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
  
  // ✨ NUOVO: Verifica per challenge PAID
  if (challenge.gameMode === 'paid') {
    const { PurchaseService } = await import('./purchase.service.js');
    const hasPurchased = await PurchaseService.hasPurchased(userId, challengeId);
    
    if (!hasPurchased) {
      throw { 
        code: 403, 
        message: 'Devi acquistare questa challenge prima di iscriverti' 
      };
    }
  }
  
  // ✨ NUOVO: Verifica accesso per tipo di pacchetto
  if (challenge.gameMode !== 'paid' && challenge.gameMode !== 'free') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { packageType: true }
    });
    
    const { PurchaseService } = await import('./purchase.service.js');
    if (!PurchaseService.isPackageCompatible(user.packageType, challenge.gameMode)) {
      throw { 
        code: 403, 
        message: `Questa challenge richiede un pacchetto ${challenge.gameMode.toUpperCase()}` 
      };
    }
  }
  
  const participant = await partRepo.create(userId, challengeId);
  await repo.incrementParticipants(challengeId);
  await partRepo.incrementUserChallenges(userId);
  
  return participant;
}

export async function getAllChallenges(userId = null) {
  const challenges = await repo.findAll();
  
  // Se non c'è un userId, ritorna tutte le challenge pubbliche
  if (!userId) {
    return challenges.filter(c => c.visibility === 'public');
  }
  
  // Altrimenti, aggiungi info su acquisti e prezzi per l'utente
  const { PurchaseService } = await import('./purchase.service.js');
  
  const challengesWithUserInfo = await Promise.all(
    challenges.map(async (challenge) => {
      // Per challenge a pagamento, verifica se è stata acquistata
      if (challenge.gameMode === 'paid') {
        const hasPurchased = await PurchaseService.hasPurchased(userId, challenge.id);
        const userPrice = await PurchaseService.calculatePrice(challenge.id, userId);
        
        return {
          ...challenge,
          purchasedBy: hasPurchased ? [{ userId }] : [],
          userPrice
        };
      }
      
      return challenge;
    })
  );
  
  return challengesWithUserInfo;
}

// ✨ FUNZIONE AGGIORNATA per includere info su challenge paid
export async function getUserChallenges(userId) {
  const participants = await prisma.participant.findMany({
    where: { userId },
    include: {
      challenge: {
        include: {
          game: true,
          _count: { select: { participants: true } },
          // ✨ NUOVO: Includi info sugli acquisti per challenge paid
          purchasedBy: {
            where: { userId },
            select: { userId: true }
          }
        }
      },
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
    attempts: p.attempts.length,
    // Aggiungi flag per identificare che l'utente è iscritto
    participants: [{ userId }],
    // ✨ NUOVO: Mantieni info su acquisto se è una challenge paid
    isPurchased: p.challenge.purchasedBy?.length > 0
  }));
}

export async function getChallengeWithUserInfo(challengeId, userId) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      game: true,
      participants: {
        where: { userId },
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
    userAttempts: userParticipant?.attempts || [],
    // Assicurati che participants contenga l'userId per il frontend
    participants: isParticipating ? [{ userId }] : []
  };
}

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