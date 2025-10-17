const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3200

// Middleware pour JSON
app.use(cors());
app.use(express.json());

// Route test
app.get('/', (req, res) => {
  res.send('Backend Express fonctionne 🚀');
});

// Lancer serveur
app.listen(PORT, () => {
  console.log(`Serveur Express démarré sur http://localhost:${PORT}`);
});
