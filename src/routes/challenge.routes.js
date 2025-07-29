// src/routes/challenge.routes.js

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { 
  create, 
  list, 
  join, 
  getUserChallenges 
} from '../controllers/challenge.controller.js';
import {
  create as gameAttemptCreate,
  leaderboard as gameLeaderboard,
  dailyLeaderboard as timerDailyLeaderboard,
  checkAttemptStatus,
  quickCheckCanPlay
} from '../controllers/gameAttempt.controller.js';

const router = Router();

// Routes per le challenge
router.get('/', authenticate, list);                              // Lista tutte le challenge
router.post('/', authenticate, create);                           // Crea nuova challenge
router.post('/:id/join', authenticate, join);                     // Iscriviti a una challenge
router.get('/user/:userId', authenticate, getUserChallenges);     // Challenge dell'utente

// Routes per il gioco Timer
router.post('/:id/timer/attempt', authenticate, gameAttemptCreate);      // Nuovo tentativo
router.get('/:id/timer/leaderboard', gameLeaderboard);                  // Classifica generale
router.get('/:id/timer/daily-leaderboard', timerDailyLeaderboard);      // Classifica giornaliera
router.get('/:id/timer/status', authenticate, checkAttemptStatus);       // Controlla se può giocare
router.get('/:id/timer/quick-status', authenticate, quickCheckCanPlay);  // Check veloce

export default router;