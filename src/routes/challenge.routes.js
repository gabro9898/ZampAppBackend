// src/routes/challenge.routes.js (AGGIUNGI QUESTE ROUTE)
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { create, list, join } from '../controllers/challenge.controller.js';
import {
  create as gameAttemptCreate,
  leaderboard as gameLeaderboard,
  dailyLeaderboard as timerDailyLeaderboard,
  checkAttemptStatus
} from '../controllers/gameAttempt.controller.js';

const router = Router();

router.get('/', authenticate, list);  // Lista tutte le challenge
router.post('/', authenticate, create); // Crea nuova challenge  
router.post('/:id/join', authenticate, join); // Iscriviti a una challenge

router.post('/:id/timer/attempt', authenticate, gameAttemptCreate);// Timer attempts
// Fai tentativo
router.get('/:id/timer/leaderboard', gameLeaderboard); // Classifica generale

// NUOVE ROUTE per sistema giornaliero
router.get('/:id/timer/daily-leaderboard', timerDailyLeaderboard);  // ?date=2025-07-24        // Classifica giornaliera
router.get('/:id/timer/status', authenticate, checkAttemptStatus);   // controlla se può giocare // Controlla se può giocare

export default router;