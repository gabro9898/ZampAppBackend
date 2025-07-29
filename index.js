import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma/index.js'; 
import authRoutes from './src/routes/auth.routes.js';
import challengeRoutes from './src/routes/challenge.routes.js';
import gameRoutes from './src/routes/game.routes.js';
import shopRoutes from './src/routes/shop.routes.js'; 


dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/shop', shopRoutes);

app.get('/', (req, res) => {
  res.send('Backend connesso ✅');
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server attivo su http://localhost:${PORT}`);
});
