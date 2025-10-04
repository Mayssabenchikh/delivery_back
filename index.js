const express = require('express');
const app = express();
const PORT = 3200;

// Middleware pour JSON
app.use(express.json());

// Route test
app.get('/', (req, res) => {
  res.send('Backend Express fonctionne 🚀');
});

// Lancer serveur
app.listen(PORT, () => {
  console.log(`Serveur Express démarré sur http://localhost:${PORT}`);
});
