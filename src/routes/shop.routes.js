// src/routes/shop.routes.js
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getShopChallenges,
  purchaseChallenge,
  getUserPurchases,
  calculatePrice,
  checkAccess
} from '../controllers/shop.controller.js';

const router = Router();

// Tutte le route dello shop richiedono autenticazione
router.use(authenticate);

// Route shop
router.get('/challenges/:userId', getShopChallenges);        // Challenge disponibili per acquisto
router.post('/purchase', purchaseChallenge);                 // Acquista una challenge
router.get('/purchases/:userId', getUserPurchases);          // Storico acquisti utente
router.get('/price/:challengeId', calculatePrice);          // Calcola prezzo personalizzato
router.get('/access/:challengeId', checkAccess);            // Verifica accesso

export default router;