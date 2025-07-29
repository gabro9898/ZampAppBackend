// src/controllers/challenge.controller.js
import * as service from '../services/challenge.service.js';

export const create = async (req, res) => {
  try {
    const challenge = await service.createChallenge(req.body);
    res.status(201).json(challenge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const list = async (_, res) => {
  const list = await service.getAllChallenges?.() ?? [];
  res.json(list);
};

export async function join(req, res) {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;
    
    const participant = await service.joinChallenge(userId, challengeId);
    
    // Restituisci anche la challenge aggiornata con l'informazione del partecipante
    const updatedChallenge = await service.getChallengeWithUserInfo(challengeId, userId);
    
    res.status(201).json({
      participant,
      challenge: updatedChallenge
    });
  } catch (err) {
    res.status(err.code || 400).json({ error: err.message });
  }
}

export async function getUserChallenges(req, res) {
  try {
    const { userId } = req.params;
    
    // Verifica che l'utente possa vedere solo le sue challenge
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    const challenges = await service.getUserChallenges(userId);
    res.json(challenges);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}