// src/services/game.service.js
import { GameEngineFactory } from '../games/GameEngineFactory.js';
import * as gameRepo from '../repositories/game.repository.js';

export async function createGame(gameData) {
  // Verifica che il tipo di gioco sia supportato
  const supportedTypes = GameEngineFactory.getSupportedTypes();
  if (gameData.type && !supportedTypes.includes(gameData.type)) {
    throw new Error(`Game type '${gameData.type}' not supported. Available: ${supportedTypes.join(', ')}`);
  }
  
  return gameRepo.create(gameData);
}

export async function getGameMetadata(gameType, config = {}) {
  const engine = GameEngineFactory.create(gameType, config);
  return engine.getGameMetadata();
}

export async function getAllGames() {
  return gameRepo.findAll();
}