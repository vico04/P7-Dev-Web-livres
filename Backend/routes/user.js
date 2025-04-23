//Import d'express
const express = require('express');
//Appel du router
const router = express.Router();

const userCtrl = require('../controllers/user');

//Creation des routes
router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);

module.exports = router;
