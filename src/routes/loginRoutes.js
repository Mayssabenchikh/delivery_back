import express from 'express';
import { login } from '../controllers/authController.js';

const router = express.Router();  // ⚠️ <-- important, tu avais oublié ça

// Route de test
router.post('/test', (req, res) => {
  console.log('Body reçu test:', req.body);
  res.json({ message: 'Test OK' });
});
router.post('/login', login);

export default router;
