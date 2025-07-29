// src/services/purchase.service.js
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

export class PurchaseService {
  /**
   * Calcola il prezzo di una challenge per un utente specifico
   */
  static async calculatePrice(challengeId, userId) {
    const [challenge, user] = await Promise.all([
      prisma.challenge.findUnique({ 
        where: { id: challengeId },
        select: { price: true, pricesByPackage: true, gameMode: true }
      }),
      prisma.user.findUnique({ 
        where: { id: userId },
        select: { packageType: true }
      })
    ]);

    if (!challenge || !user) {
      throw new Error('Challenge o utente non trovato');
    }

    // Se la challenge non è a pagamento, prezzo 0
    if (challenge.gameMode !== 'paid') {
      return 0;
    }

    // Se ci sono prezzi differenziati per pacchetto
    if (challenge.pricesByPackage && challenge.pricesByPackage[user.packageType]) {
      return Number(challenge.pricesByPackage[user.packageType]);
    }

    // Altrimenti usa il prezzo base
    return Number(challenge.price);
  }

  /**
   * Verifica se un utente ha acquistato una challenge
   */
  static async hasPurchased(userId, challengeId) {
    const purchase = await prisma.purchasedChallenge.findUnique({
      where: {
        userId_challengeId: { userId, challengeId }
      }
    });
    return !!purchase;
  }

  /**
   * Verifica se un utente può accedere a una challenge
   */
  static async canAccess(userId, challengeId) {
    const [challenge, user, hasPurchased] = await Promise.all([
      prisma.challenge.findUnique({ 
        where: { id: challengeId },
        select: { gameMode: true }
      }),
      prisma.user.findUnique({ 
        where: { id: userId },
        select: { packageType: true }
      }),
      this.hasPurchased(userId, challengeId)
    ]);

    if (!challenge || !user) return false;

    // Se è una challenge a pagamento, deve averla acquistata
    if (challenge.gameMode === 'paid') {
      return hasPurchased;
    }

    // Altrimenti verifica il pacchetto
    return this.isPackageCompatible(user.packageType, challenge.gameMode);
  }

  /**
   * Verifica se un pacchetto utente è compatibile con una challenge
   */
  static isPackageCompatible(userPackage, challengeMode) {
    const packageHierarchy = {
      'free': ['free'],
      'pro': ['free', 'pro'],
      'premium': ['free', 'pro', 'premium'],
      'vip': ['free', 'pro', 'premium', 'vip']
    };

    const allowedModes = packageHierarchy[userPackage] || [];
    return allowedModes.includes(challengeMode);
  }

  /**
   * Acquista una challenge
   */
  static async purchaseChallenge(userId, challengeId, paymentData = {}) {
    // Verifica che la challenge esista e sia acquistabile
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      throw new Error('Challenge non trovata');
    }

    if (challenge.gameMode !== 'paid') {
      throw new Error('Questa challenge non è acquistabile');
    }

    // Verifica che non sia già stata acquistata
    const existingPurchase = await this.hasPurchased(userId, challengeId);
    if (existingPurchase) {
      throw new Error('Challenge già acquistata');
    }

    // Calcola il prezzo
    const price = await this.calculatePrice(challengeId, userId);

    // Qui andrebbe integrata la logica di pagamento reale (Stripe, PayPal, etc.)
    // Per ora simuliamo un pagamento andato a buon fine

    // Registra l'acquisto
    const purchase = await prisma.purchasedChallenge.create({
      data: {
        userId,
        challengeId,
        pricePaid: price,
        paymentMethod: paymentData.method || 'test',
        transactionId: paymentData.transactionId || `test_${Date.now()}`
      }
    });

    return purchase;
  }

  /**
   * Ottieni tutte le challenge acquistate da un utente
   */
  static async getUserPurchases(userId) {
    return await prisma.purchasedChallenge.findMany({
      where: { userId },
      include: {
        challenge: {
          include: {
            game: true,
            _count: { select: { participants: true } }
          }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    });
  }

  /**
   * Ottieni le challenge disponibili per l'acquisto
   */
  static async getShopChallenges(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { packageType: true }
    });

    if (!user) throw new Error('Utente non trovato');

    // Prendi tutte le challenge a pagamento non ancora acquistate
    const paidChallenges = await prisma.challenge.findMany({
      where: {
        gameMode: 'paid',
        visibility: { in: ['public', 'shop'] },
        endDate: { gt: new Date() }, // Solo challenge attive
        purchasedBy: {
          none: { userId }
        }
      },
      include: {
        game: true,
        _count: { select: { participants: true } }
      }
    });

    // Aggiungi il prezzo personalizzato per ogni challenge
    const challengesWithPrice = await Promise.all(
      paidChallenges.map(async (challenge) => {
        const price = await this.calculatePrice(challenge.id, userId);
        return {
          ...challenge,
          userPrice: price
        };
      })
    );

    return challengesWithPrice;
  }
}