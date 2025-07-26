import * as userRepo from '../repositories/user.repository.js';
import { hashPassword, verifyPassword, generateJwt } from '../utils/auth.utils.js';

export async function registerUser(data) {
  const { email, password, ...rest } = data;
  if (await userRepo.findByEmail(email)) throw new Error('Email già registrata');

  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({ email, passwordHash, ...rest });
  return generateJwt(user.id);
}

export async function loginUser({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Credenziali non valide');

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error('Credenziali non valide');

  return generateJwt(user.id);
}
