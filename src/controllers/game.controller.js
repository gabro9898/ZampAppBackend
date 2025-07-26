// src/controllers/game.controller.js
import * as gameService from '../services/game.service.js';

export const create = async (req, res) => {
  try {
    const game = await gameService.createGame(req.body);
    res.status(201).json(game);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const list = async (req, res) => {
  try {
    const games = await gameService.getAllGames();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMetadata = async (req, res) => {
  try {
    const { type } = req.params;
    const metadata = await gameService.getGameMetadata(type, req.query);
    res.json(metadata);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};