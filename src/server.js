const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const companyRoutes = require('./routes/company');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const userRoutes = require('./routes/user');       // ton fichier CRUD User


const app = express();
const PORT = process.env.PORT || 3200;

// Middlewares
app.use(cors({
  origin: 'http://localhost:4200', // URL de ton Angular
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/company', companyRoutes);
app.use('/user', userRoutes);       // nouveau : toutes les routes User préfixées par /user

// Servir les fichiers uploadés (MUST use ../ since server.js is in src/)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Gestion des routes non trouvées (CORRIGÉ ICI)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});





// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});