// src/controllers/shop.controller.js
import { PurchaseService } from '../services/purchase.service.js';
import { serializeData } from '../utils/serializer.js';

/**
 * Ottieni le challenge disponibili nello shop per un utente
 * @route GET /api/shop/challenges/:userId
 */
export async function getShopChallenges(req, res) {
  try {
    const { userId } = req.params;
    
    // Verifica che l'utente possa vedere solo le sue challenge
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    const challenges = await PurchaseService.getShopChallenges(userId);
    const serialized = serializeData(challenges);
    
    res.json(serialized);
  } catch (error) {
    console.error('Error getting shop challenges:', error);
    res.status(500).json({ 
      error: 'Errore nel recupero delle challenge',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Acquista una challenge
 * @route POST /api/shop/purchase
 */
export async function purchaseChallenge(req, res) {
  try {
    const { userId, challengeId, paymentData } = req.body;
    
    // Verifica che l'utente possa acquistare solo per se stesso
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    const purchase = await PurchaseService.purchaseChallenge(
      userId, 
      challengeId, 
      paymentData
    );
    
    const serialized = serializeData(purchase);
    
    res.status(201).json({
      success: true,
      purchase: serialized,
      message: 'Challenge acquistata con successo'
    });
  } catch (error) {
    console.error('Error purchasing challenge:', error);
    res.status(400).json({ 
      error: error.message || 'Errore durante l\'acquisto'
    });
  }
}

/**
 * Ottieni gli acquisti dell'utente
 * @route GET /api/shop/purchases/:userId
 */
export async function getUserPurchases(req, res) {
  try {
    const { userId } = req.params;
    
    // Verifica autorizzazione
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    const purchases = await PurchaseService.getUserPurchases(userId);
    const serialized = serializeData(purchases);
    
    res.json(serialized);
  } catch (error) {
    console.error('Error getting user purchases:', error);
    res.status(500).json({ 
      error: 'Errore nel recupero degli acquisti'
    });
  }
}

/**
 * Calcola il prezzo di una challenge per un utente
 * @route GET /api/shop/price/:challengeId?userId=xxx
 */
export async function calculatePrice(req, res) {
  try {
    const { challengeId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId richiesto' });
    }
    
    const price = await PurchaseService.calculatePrice(challengeId, userId);
    
    res.json({ 
      challengeId,
      userId,
      price,
      formatted: `€${price}`
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({ 
      error: 'Errore nel calcolo del prezzo'
    });
  }
}

/**
 * Verifica se un utente può accedere a una challenge
 * @route GET /api/shop/access/:challengeId?userId=xxx
 */
export async function checkAccess(req, res) {
  try {
    const { challengeId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId richiesto' });
    }
    
    const canAccess = await PurchaseService.canAccess(userId, challengeId);
    
    res.json({ 
      challengeId,
      userId,
      canAccess,
      message: canAccess ? 'Accesso consentito' : 'Accesso negato'
    });
  } catch (error) {
    console.error('Error checking access:', error);
    res.status(500).json({ 
      error: 'Errore nella verifica accesso'
    });
  }
}