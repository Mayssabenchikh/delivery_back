const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const company = require('./routes/company.routes');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const kpiRoutes = require('./routes/kpi.routes');
const locationRoutes = require("./routes/location.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const chatRoutes = require("./routes/chat.routes");
const delivery2Routes = require('./routes/deliveries');
const profilelivreurRoutes = require('./routes/profilelivreur');
const { initializeSocket } = require('./services/socket.service');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3200;

// Initialiser Socket.io
initializeSocket(server);

// Middlewares
app.use(cors({
  origin: 'http://localhost:4200', // URL de ton Angular
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/company', company);
app.use('/api/company', company);
app.use('/api/deliveries', delivery2Routes);

// Profile livreur (routes protégées par middleware interne)
app.use('/api/profilelivreur', profilelivreurRoutes);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/kpi', kpiRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/chat", chatRoutes);

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
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io initialized`);
});
