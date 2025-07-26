

import { TimerGameEngine } from './TimerGameEngine.js';

export class GameEngineFactory {
  static engines = new Map();
  
  static register(gameType, engineClass) {
    this.engines.set(gameType, engineClass);
  }
  
  static create(gameType, config = {}) {
    const EngineClass = this.engines.get(gameType);
    if (!EngineClass) {
      throw new Error(`Game engine not found for type: ${gameType}`);
    }
    return new EngineClass(config);
  }
  
  static getSupportedTypes() {
    return Array.from(this.engines.keys());
  }
  
}
GameEngineFactory.register('timer', TimerGameEngine);