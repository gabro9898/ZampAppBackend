import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login',    login);

// AGGIUNGI QUESTO ENDPOINT
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { PrismaClient } = await import('../../generated/prisma/index.js');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        packageType: true,
        packageExpiresAt: true,
        level: true,
        xp: true,
        streak: true,
        lastPlayedDate: true,
        challengesPlayed: true,
        prizesWon: true,
        prizesValue: true,
        joinedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('📊 Profile data being sent:', user);
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

export default router;
