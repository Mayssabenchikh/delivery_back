import db from '../db/connection.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const login = (req, res) => {
  const { email, password } = req.body;
  console.log('[LOGIN] body:', req.body);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et password requis' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('[LOGIN] Erreur SQL:', err);
      
      return res.status(500).json({ message: 'Erreur serveur (SQL)', error: err.message });
    }

    if (!results || results.length === 0) {
      console.log('[LOGIN] Utilisateur non trouvé pour email:', email);
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    const user = results[0];
    console.log('[LOGIN] user trouvé id/email:', user.id, user.email, 'password in DB startsWith:', (user.password || '').slice(0,4));

    try {
      if (!user.password) {
        console.error('[LOGIN] password manquant en base pour user id', user.id);
        return res.status(500).json({ message: 'Erreur serveur: mot de passe manquant en base' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.log('[LOGIN] Mot de passe incorrect pour', email);
        return res.status(400).json({ message: 'Mot de passe incorrect' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      );

      return res.json({
        message: 'Connecté avec succès',
        token,
        role: user.role,
        user: { id: user.id, name: user.name, email: user.email }
      });
    } catch (e) {
      console.error('[LOGIN] Erreur lors de bcrypt.compare ou JWT:', e);
      return res.status(500).json({ message: 'Erreur serveur (bcrypt/jwt)', error: e.message });
    }
  });
};
