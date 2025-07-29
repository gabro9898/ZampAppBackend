// src/repositories/challenge.repository.js
import { PrismaClient } from '../../generated/prisma/index.js';
const prisma = new PrismaClient();

export const create = (data) => prisma.challenge.create({ 
  data,
  include: { game: true }
});

export const findAll = () =>
  prisma.challenge.findMany({
    include: {
      game: true,
      participants: {
        select: {
          userId: true
        }
      },
      _count: { 
        select: { 
          participants: true 
        } 
      }
    },
    orderBy: { startDate: 'desc' }
  });

export const findById = (id) =>
  prisma.challenge.findUnique({
    where: { id },
    include: { 
      game: true,
      participants: {
        select: {
          userId: true
        }
      },
      _count: { 
        select: { 
          participants: true 
        } 
      } 
    }
  });

export const findGameById = (gameId) =>
  prisma.game.findUnique({ where: { id: gameId } });

export const incrementParticipants = (id) =>
  prisma.challenge.update({
    where: { id },
    data: { /* se hai un campo counter */ }
  });