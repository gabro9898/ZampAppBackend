// src/services/userProgression.service.js
import { PrismaClient } from '../../generated/prisma/index.js';
import { DateUtils } from '../utils/dateUtils.js';

const prisma = new PrismaClient();

export class UserProgressionService {
  
  /**
   * Aggiorna XP e streak dopo un tentativo
   */
  static async updateAfterAttempt(userId, challengeId, isFirstAttemptToday = false) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        participants: {
          where: { challengeId },
          include: { challenge: true }
        }
      }
    });

    if (!user) throw new Error('User not found');

    const updates = {};
    const participant = user.participants[0];
    
    // 1. Aggiungi XP per giocate free
    if (participant?.challenge.gameMode === 'free' || participant?.challenge.price == 0) {
      updates.xp = user.xp + 1;
    }
    
    // 2. Aggiorna streak se è il primo tentativo del giorno
    if (isFirstAttemptToday) {
      const lastPlayed = user.lastPlayedDate ? new Date(user.lastPlayedDate) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (lastPlayed) {
        const lastPlayedDay = new Date(lastPlayed);
        lastPlayedDay.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - lastPlayedDay) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Giocato ieri, continua streak
          updates.streak = user.streak + 1;
        } else if (daysDiff > 1) {
          // Streak interrotto
          updates.streak = 1;
        }
        // Se daysDiff === 0, ha già giocato oggi, non cambiare streak
      } else {
        // Prima volta che gioca
        updates.streak = 1;
      }
      
      updates.lastPlayedDate = new Date();
    }
    
    // 3. Calcola nuovo livello basato su XP
    if (updates.xp) {
      updates.level = this.calculateLevel(updates.xp);
    }
    
    // 4. Applica aggiornamenti
    if (Object.keys(updates).length > 0) {
      return await prisma.user.update({
        where: { id: userId },
        data: updates
      });
    }
    
    return user;
  }
  
  /**
   * Calcola il livello basato sugli XP
   */
  static calculateLevel(xp) {
    // Formula: ogni livello richiede 100 XP in più del precedente
    // Livello 1: 0-99 XP
    // Livello 2: 100-299 XP
    // Livello 3: 300-599 XP
    // etc.
    let level = 1;
    let xpRequired = 100;
    let totalXpRequired = 0;
    
    while (xp >= totalXpRequired + xpRequired) {
      totalXpRequired += xpRequired;
      level++;
      xpRequired += 100;
    }
    
    return level;
  }
  
  /**
   * Ottieni XP necessari per il prossimo livello
   */
  static getXpForNextLevel(currentLevel) {
    // XP totali necessari per raggiungere currentLevel
    let totalXp = 0;
    for (let i = 1; i < currentLevel; i++) {
      totalXp += i * 100;
    }
    
    // XP necessari per il prossimo livello
    const xpForNext = currentLevel * 100;
    
    return {
      currentLevelTotalXp: totalXp,
      nextLevelTotalXp: totalXp + xpForNext,
      xpNeededForNext: xpForNext
    };
  }
  
  /**
   * Controlla se è il primo tentativo del giorno per l'utente
   */
  static async isFirstAttemptToday(userId) {
    const today = DateUtils.getStartOfDay();
    const tomorrow = DateUtils.getEndOfDay();
    
    const attemptCount = await prisma.gameAttempt.count({
      where: {
        participantUserId: userId,
        attemptDate: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    return attemptCount === 0;
  }
  
  /**
   * Ottieni statistiche di progressione dell'utente
   */
  static async getUserProgressionStats(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) return null;
    
    const levelInfo = this.getXpForNextLevel(user.level);
    const xpInCurrentLevel = user.xp - levelInfo.currentLevelTotalXp;
    const xpProgress = (xpInCurrentLevel / levelInfo.xpNeededForNext) * 100;
    
    return {
      level: user.level,
      xp: user.xp,
      xpInCurrentLevel,
      xpForNextLevel: levelInfo.xpNeededForNext,
      xpProgress: Math.round(xpProgress),
      streak: user.streak,
      lastPlayed: user.lastPlayedDate,
      challengesPlayed: user.challengesPlayed,
      prizesWon: user.prizesWon
    };
  }
}