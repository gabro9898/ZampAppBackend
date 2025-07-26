// src/repositories/game.repository.js
import { PrismaClient } from '../../generated/prisma/index.js';
const prisma = new PrismaClient();

export const create = (data) => prisma.game.create({ data });

export const findAll = () => prisma.game.findMany({
  include: { _count: { select: { challenges: true } } }
});

export const findById = (id) => prisma.game.findUnique({
  where: { id },
  include: { challenges: true }
});