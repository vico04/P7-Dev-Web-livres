//Import d'express dans le routeur
const express = require('express');
const router = express.Router(); //Import de la méthode routeur d'express
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

//Import du model Book
const booksCtrl = require('../controllers/books');

//Ajout de la logique de route et remplacement de app par router
//Configuration de la route de notation
router.post('/:id/rating', auth, booksCtrl.rateBook);

//Configuration de la route bestrating
router.get('/bestrating', booksCtrl.getBestRatedBooks);

//Configuration de la reponse à la requete
router.get('/', booksCtrl.getAllBooks);

//Configuration de l'envoi d'un requete
router.post('/', auth, multer, booksCtrl.createBook);

//Récupération d'un Book spécifique
router.get('/:id', booksCtrl.getOneBook);

//Modification d'un Book
router.put('/:id', auth, multer, booksCtrl.modifyBook);

//Suppression d'un Book
router.delete('/:id', auth, booksCtrl.deleteBook);

module.exports = router;
