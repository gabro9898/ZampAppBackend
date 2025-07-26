
export class BaseGameEngine {
  constructor(config = {}) {
    this.config = config;
  }
  
  // Metodi che ogni gioco deve implementare
  validateAttempt(attemptData) {
    throw new Error('validateAttempt must be implemented');
  }
  
  calculateScore(attemptData) {
    throw new Error('calculateScore must be implemented');
  }
  
  getGameMetadata() {
    throw new Error('getGameMetadata must be implemented');
  }
  
  // Metodi opzionali
  getLeaderboardQuery(challengeId) {
    return null; // Default: usa la query standard
  }
}