import { PrismaClient } from '../../generated/prisma/index.js';
const prisma = new PrismaClient();

export const findByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

export const create = (data) =>
  prisma.user.create({ data });
