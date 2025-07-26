// src/controllers/timerAttempt.controller.js (AGGIORNATO)
import * as service from '../services/gameAttempt.service.js';
import { AttemptValidationService } from '../services/attemptValidation.service.js';

export const create = async (req, res) => {
  try {
    const attempt = await service.save(
      req.user.id,
      req.params.id,
      req.body
    );
    res.status(201).json(attempt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const leaderboard = async (req, res) => {
  try {
    const list = await service.leaderboard(req.params.id);
    res.json(list);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// NUOVE FUNZIONI
export const dailyLeaderboard = async (req, res) => {
  try {
    const { date } = req.query; // ?date=2025-07-24
    const targetDate = date ? new Date(date) : new Date();
    const list = await service.getDailyLeaderboard(req.params.id, targetDate);
    res.json(list);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const checkAttemptStatus = async (req, res) => {
  try {
    const validation = await AttemptValidationService.canMakeAttempt(
      req.user.id,
      req.params.id
    );
    
    const stats = await AttemptValidationService.getUserAttemptStats(
      req.user.id,
      req.params.id
    );
    
    res.json({
      ...validation,
      stats
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};