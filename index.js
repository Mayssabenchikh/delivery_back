const express = require('express');
const connection = require('./connect.js'); 
const cors = require('cors');
const company = require('./routes/company'); 
const app = express();




const PORT = 3200;
app.use(cors({
    origin: 'http://localhost:4200', 
    methods: ['GET','POST','PUT','DELETE'],
    credentials: true
}));
app.use(express.json());



app.use('/company', company);









// Route de base pour vérifier que le backend fonctionne
app.get('/', (req, res) => {
  res.send('✅ Backend Express fonctionne 🚀');
});
// Route pour tester la connexion MySQL
app.get('/test-db', (req, res) => {
  connection.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      console.error('❌ Erreur MySQL :', err.message);
      return res.status(500).json({ error: 'Erreur de connexion à MySQL' });
    }
    res.json({ message: '✅ MySQL fonctionne !', result: results[0].result });
  });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express démarré : http://localhost:${PORT}`);
});
