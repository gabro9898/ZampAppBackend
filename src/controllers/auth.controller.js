import * as authService from '../services/auth.service.js';

export async function register(req, res) {
  try {
    const token = await authService.registerUser(req.body);
    res.status(201).json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const token = await authService.loginUser(req.body);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
