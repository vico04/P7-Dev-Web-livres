// Chargement des variables d’environnement
require('dotenv').config();
// Import de l'application express
const express = require('express');
const bodyParser = require('body-parser'); // Lire le corps des requêtes (au format JSON)
const mongoose = require('mongoose');
const booksRoutes = require('./routes/books'); // Import du dossier routes
const userRoutes = require('./routes/user');
const path = require('path'); // Gestion du chemin des images

// Connexion à mongodb
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((error) =>
    console.error('Connexion à MongoDB échouée', error.message)
  );

// Création de l’application Express
const app = express();

// Middleware des autorisations
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  next();
});

// Lecture automatique des données JSON dans les requêtes
app.use(bodyParser.json());

// Logique importée et appliquée à la même route
app.use('/api/books', booksRoutes);
app.use('/api/auth', userRoutes);

// Autoriser l’accès aux fichiers d’images stockés dans un dossier images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Export de l'application
module.exports = app;
