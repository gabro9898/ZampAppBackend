// src/controllers/auth.controller.js - Versione corretta basata sul tuo codice originale

import * as authService from '../services/auth.service.js';
import { serializeData } from '../utils/serializer.js';

/**
 * Registrazione nuovo utente
 * @route POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const result = await authService.registerUser(req.body);
    
    // ✅ CORREZIONE: Serializza i dati prima di inviarli per evitare errori BigInt
    const serializedResult = serializeData(result);
    
    console.log('🔐 Register response:', serializedResult); // Debug log
    
    res.status(201).json(serializedResult);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Login utente esistente  
 * @route POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const result = await authService.loginUser(req.body);
    
    // ✅ CORREZIONE: Serializza i dati prima di inviarli per evitare errori BigInt
    const serializedResult = serializeData(result);
    
    console.log('🔐 Login response:', serializedResult); // Debug log
    
    res.json(serializedResult);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}