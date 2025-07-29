// src/services/auth.service.js
import * as userRepo from '../repositories/user.repository.js';
import { hashPassword, verifyPassword, generateJwt } from '../utils/auth.utils.js';

export async function registerUser(data) {
  const { email, password, ...rest } = data;
  if (await userRepo.findByEmail(email)) throw new Error('Email già registrata');

  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({ email, passwordHash, ...rest });
  
  // Ritorna sia il token che TUTTI i dati dell'utente (senza password)
  return {
    token: generateJwt(user.id),
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      packageType: user.packageType,
      packageExpiresAt: user.packageExpiresAt,
      level: user.level,
      xp: user.xp,
      streak: user.streak,
      lastPlayedDate: user.lastPlayedDate,
      challengesPlayed: user.challengesPlayed,
      prizesWon: user.prizesWon,
      prizesValue: user.prizesValue,
      joinedAt: user.joinedAt
    }
  };
}

export async function loginUser({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Credenziali non valide');

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error('Credenziali non valide');

  // Ritorna sia il token che TUTTI i dati dell'utente (senza password)
  return {
    token: generateJwt(user.id),
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      packageType: user.packageType,
      packageExpiresAt: user.packageExpiresAt,
      level: user.level,
      xp: user.xp,
      streak: user.streak,
      lastPlayedDate: user.lastPlayedDate,
      challengesPlayed: user.challengesPlayed,
      prizesWon: user.prizesWon,
      prizesValue: user.prizesValue,
      joinedAt: user.joinedAt
    }
  };
}