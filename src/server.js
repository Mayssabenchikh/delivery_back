const express = require('express');
const cors = require('cors');
const path = require('path');
const company = require('./routes/company');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const contactRoutes = require('./routes/contact.routes');

const app = express();
const PORT = process.env.PORT || 3200;

// Middlewares
app.use(cors({
  origin: 'http://localhost:4200', // URL de ton Angular
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/company', company);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contact', contactRoutes)

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Gestion des routes non trouvées (CORRIGÉ ICI)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});