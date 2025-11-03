const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'w9ayetdelivery'
});

// Se connecter
connection.connect((err) => {
  if (err) {
    console.error('❌ Erreur de connexion MySQL :', err.message);
    console.error('Code erreur:', err.code);
    console.error('\n⚠️  MySQL n\'est pas démarré. Veuillez démarrer MySQL et redémarrer l\'application.\n');
    // Ne pas arrêter l'application, juste logger l'erreur
    return;
  }
  console.log('✅ Connecté à MySQL !');
});

module.exports = connection;