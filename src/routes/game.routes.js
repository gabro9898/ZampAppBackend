// src/routes/game.routes.js
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { create, list, getMetadata } from '../controllers/game.controller.js';

const router = Router();

router.get('/', list);
router.post('/', authenticate, create);
router.get('/metadata/:type', getMetadata);

export default router;