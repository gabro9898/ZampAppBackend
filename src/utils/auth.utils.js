import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET  = process.env.JWT_SECRET || 'supersegretissimo';
const JWT_EXPIRES = '7d';

export const hashPassword   = (pwd) => bcrypt.hash(pwd, SALT_ROUNDS);
export const verifyPassword = (pwd, hash) => bcrypt.compare(pwd, hash);
export const generateJwt    = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
