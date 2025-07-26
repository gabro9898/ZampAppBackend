
import * as repo from '../repositories/challenge.repository.js';
import * as partRepo from '../repositories/participant.repository.js';
import { GameEngineFactory } from '../games/GameEngineFactory.js';

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