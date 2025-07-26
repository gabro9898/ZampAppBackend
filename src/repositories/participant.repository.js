import { PrismaClient } from '../../generated/prisma/index.js';
const prisma = new PrismaClient();

export const find = (userId, challengeId) =>
  prisma.participant.findUnique({
    where: { userId_challengeId: { userId, challengeId } }
  });

export const create = (userId, challengeId) =>
  prisma.participant.create({
    data: { userId, challengeId }
  });

export const incrementUserChallenges = (userId) =>
  prisma.user.update({
    where: { id: userId },
    data: { challengesPlayed: { increment: 1 } }
  });
