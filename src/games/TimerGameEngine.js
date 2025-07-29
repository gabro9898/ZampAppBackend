// src/games/TimerGameEngine.js
import { BaseGameEngine } from './BaseGameEngine.js';

export class TimerGameEngine extends BaseGameEngine {
  constructor(config = {}) {
    super({
      targetMillis: 10000, // 10 secondi
      maxAttempts:  null,  // illimitati
      ...config,
    });
  }

  validateAttempt(attemptData) {
    const { elapsedMillis } = attemptData;

    if (!elapsedMillis || elapsedMillis < 0) {
      throw new Error('elapsedMillis must be a positive number');
    }
    if (elapsedMillis > 60000) { // max 1 minuto
      throw new Error('Tempo troppo lungo, riprova');
    }
    return true;
  }

  calculateScore(attemptData) {
    const { elapsedMillis } = attemptData;
    const diffMillis = Math.abs(this.config.targetMillis - elapsedMillis);

    return {
      elapsedMillis,
      diffMillis,
      score: diffMillis, // più basso = migliore
      metadata: {
        targetMillis: this.config.targetMillis,
        accuracy: ((10000 - diffMillis) / 10000 * 100).toFixed(2) + '%',
      },
    };
  }

  getGameMetadata() {
    return {
      type: 'timer',
      name: 'Timer 10 Secondi',
      description: 'Premi start, aspetta 10 secondi nella tua mente, poi premi stop!',
      rules: {
        targetSeconds: this.config.targetMillis / 1000,
        maxAttempts:   this.config.maxAttempts,
        scoringSystem: 'lower_is_better',
      },
      ui: {
        hasStartButton: true,
        hasStopButton:  true,
        showRealTimeTimer: false,
      },
    };
  }

  // Query custom per timer: raggruppa per utente e prende il miglior tentativo
  getLeaderboardQuery(/* challengeId */) {
    return `
      SELECT 
        "participantUserId",
        MIN("score")     AS "bestScore",
        COUNT(*)         AS "totalAttempts",
        MIN("createdAt") AS "firstAttempt",
        MAX("createdAt") AS "lastAttempt"
      FROM "GameAttempt"
      WHERE "participantChallengeId" = $1
        AND "gameType" = 'timer'
      GROUP BY "participantUserId"
      ORDER BY "bestScore" ASC
    `;
  }
}
