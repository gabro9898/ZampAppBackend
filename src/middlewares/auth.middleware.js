import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersegretissimo';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);

    req.user = { id: payload.userId }; // puoi aggiungere altre info
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }
}
