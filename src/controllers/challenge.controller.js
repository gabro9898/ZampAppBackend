// src/controllers/challenge.controller.js - Versione Completa
import * as service from '../services/challenge.service.js';

export const create = async (req, res) => {
  try {
    const challenge = await service.createChallenge(req.body);
    res.status(201).json(challenge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✨ FUNZIONE AGGIORNATA per passare userId
export const list = async (req, res) => {
  try {
    // Passa l'userId se l'utente è autenticato
    const userId = req.user?.id || null;
    const list = await service.getAllChallenges(userId) ?? [];
    res.json(list);
  } catch (error) {
    console.error('Error listing challenges:', error);
    res.status(500).json({ error: 'Errore nel recupero delle challenge' });
  }
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