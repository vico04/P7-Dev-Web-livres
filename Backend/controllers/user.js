const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

//Import du modele user
const User = require('../models/User');

//Fonction pour enregistrement utilisateur
exports.signup = (req, res, next) => {
  if (!req.body || !req.body.email || !req.body.password) {
    //Vérification des champs
    return res.status(400).json({ message: 'la requête est invalide' });
  }
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      user
        .save()
        .then(() => res.status(201).json({ message: 'utilisateur créé' }))
        .catch((error) => {
          console.error('Erreur lors de la connexion :', error);
          res.status(500).json({ error });
        });
    })
    .catch((error) => res.status(500).json({ error }));
};

//Fonction pour connecter les utilisateurs existant
exports.login = (req, res, next) => {
  if (!req.body || !req.body.email || !req.body.password) {
    //Vérification des champs
    return res.status(400).json({ message: 'la requête est invalide' });
  }
  User.findOne({ email: req.body.email }) //Recherche dans la base de donnée
    .then((user) => {
      if (user === null) {
        res
          .status(401)
          .json({ message: 'Paire identifiant/mot de passe incorrecte' });
      } else {
        bcrypt
          .compare(req.body.password, user.password) //Comparaison du mdp entré et du mdp de la base de donnée
          .then((valid) => {
            if (!valid) {
              res
                .status(401)
                .json({ message: 'Paire identifiant/mot de passe incorrecte' });
            } else {
              res.status(200).json({
                userId: user._id,
                token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
                  expiresIn: '24h',
                }),
              });
            }
          })
          .catch((error) => {
            console.error('Erreur lors de la connexion :', error);
            res.status(500).json({ error });
          });
      }
    })
    .catch((error) => {
      //Erreur de traitement
      console.error('Erreur lors de la connexion :', error);
      res.status(500).json({ error });
    });
};
