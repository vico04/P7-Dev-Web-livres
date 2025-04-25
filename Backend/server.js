// Chargement des variables d’environnement
require('dotenv').config();
// Import du package HTTP de node
const http = require('http');
// Import de ficher express
const app = require('./app');

// Vérification si le port est un nombre valide
const normalizePort = (val) => {
  const port = parseInt(val, 10); // Transforme val en nombre décimal

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  } else {
    return false;
  }
};

// Indication du port d'écoute de express
const port = normalizePort(process.env.PORT || 4000); // On récupère la fonction précédente
app.set('port', port); // Memoriser ce port dans l'app Express

// Gestion des erreurs
const errorHandler = (error) => {
  // Verification si l'erreur ne vient pas listen
  if (error.syscall !== 'listen') {
    // serveur bien en ecoute ou non
    throw error;
  }
  // Creation du message d'erreur bind pour savoir quelle est l'erreur
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe' + address : 'port' + port;
  // Analyse du code erreur + action en fonction du type d’erreur
  switch (error.code) {
    case 'EACCES': // Permission refusée // Le port ou pipe demande des droits administrateur.
      console.error(bind + 'Privilèges élevés requis');
      process.exit(1);
      break;
    case 'EADDRINUSE': // Port déjà utilisé
      console.error(bind + 'Port déjà utilisé');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// Création du serveur
const server = http.createServer(app); // Appel de app

// Décryptage du code
server.on('error', errorHandler); // Exécute la fonction errorHandler si une erreur se produit au démarrage
server.on('listening', () => {
  // Affiche un message quand le serveur est pret
  const address = server.address(); // On récupère l’adresse où le serveur est en train d’écouter :
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
});

// Démarrage du server
server.listen(port);
