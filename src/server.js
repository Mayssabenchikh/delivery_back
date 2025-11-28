const express = require('express');
const cors = require('cors');
const path = require('path');
const companyRoutes = require('./routes/company.routes');
const companyRoutesV2 = require('./routes/company/company.routes');

const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const locationRoutes = require("./routes/location.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const contactRoutes = require('./routes/contact.routes');
const allCompaniesRoutes = require('./routes/allCompanies.routes');
const userRoutes = require('./routes/user');
const chatRoutes = require("./routes/chat.routes");
const delivery2Routes = require('./routes/deliveries');
const profilelivreurRoutes = require('./routes/profilelivreur');
/****************** */
const driversRoutes = require('./routes/company/drivers.routes');
const deliveriescomRoutes = require('./routes/company/deliveries.routes');
const statisticsRoutes = require('./routes/company/statistics.routes');

const { initializeSocket } = require('./services/socket.service');
const kpiRoutes = require('./routes/kpi.routes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3200;

// Initialiser Socket.io
initializeSocket(server);

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRoutes);       // nouveau : toutes les routes User préfixées par /user
app.use('/api/deliveries', delivery2Routes);

// Profile livreur (routes protégées par middleware interne)
app.use('/api/profilelivreur', profilelivreurRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/company', companyRoutes);
app.use('/api/company', companyRoutesV2);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/kpi', kpiRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/allCompanies', allCompaniesRoutes);
app.use("/api/chat", chatRoutes);
/******************** */
app.use('/api/company/drivers', driversRoutes);
app.use('/api/company/deliveries', deliveriescomRoutes);
app.use('/api/company/statistics', statisticsRoutes);
// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});



// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io initialized`);
});

