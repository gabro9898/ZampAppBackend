import * as service from '../services/challenge.service.js';

export const create = async (req, res) => {
  try {
    const challenge = await service.createChallenge(req.body);
    res.status(201).json(challenge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const list = async (_, res) => {
  const list = await service.getAllChallenges?.() ?? [];
  res.json(list);
};

export async function join(req, res) {
  try {
    const challengeId = req.params.id;
    const userId      = req.user.id;

    const participant = await service.joinChallenge(userId, challengeId);
    res.status(201).json(participant);
  } catch (err) {
    res.status(err.code || 400).json({ error: err.message });
  }
}