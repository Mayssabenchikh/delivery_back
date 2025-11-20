const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const companyRoutes = require('./routes/company');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const contactRoutes = require('./routes/contact.routes');
const allCompaniesRoutes = require('./routes/allCompanies.routes');
const userRoutes = require('./routes/user');

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

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contact', contactRoutes)
app.use('/api/allCompanies', allCompaniesRoutes)

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});



// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});