//Import du middleware d'authentification, du modele Book et du package de modification des fichiers
const auth = require('../middleware/auth');
const Book = require('../models/Book');
const fs = require('fs'); //module Node.js pour gérer les fichiers de suppression
const sharp = require('sharp');
const path = require('path');

//Logique des envois
exports.createBook = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: 'Image manquante. Veuillez ajouter une image.' });
    }

    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const notes = bookObject.ratings || []; // Si pas de notes, on met un tableau vide

    if (notes.length > 0) {
      // On filtre pour ne garder que les notes valides
      const validNotes = notes.filter(
        (note) =>
          typeof note.grade === 'number' &&
          note.grade > 0 &&
          note.grade <= 5 &&
          typeof note.userId === 'string'
      );

      // Si au moins une note valide, on calcule la moyenne
      if (validNotes.length > 0) {
        bookObject.ratings = validNotes;

        const sum = validNotes.reduce((acc, note) => acc + note.grade, 0);
        const average = sum / validNotes.length;

        bookObject.averageRating = average;
      } else {
        // Si aucune note valide
        bookObject.ratings = [];
        bookObject.averageRating = 0;
      }
    } else {
      // Si aucune note envoyée
      bookObject.ratings = [];
      bookObject.averageRating = 0;
    }

    // Définir les noms des images optimisées pour le dossier images
    const filename = req.file.filename.split('.')[0];
    const filenameOptimized = `${Date.now()}-${filename}.webp`;

    // Définir les chemins de sortie
    const outputPathImage = path.join('images', filenameOptimized);

    // Utiliser Sharp pour compresser et redimensionner en deux versions
    await sharp(req.file.path)
      .resize({ width: 450, height: 580 }) // Ajuste à la taille de la galerie
      .webp({ quality: 80 })
      .toFile(outputPathImage);

    // Supprimer l’image originale non compressée
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.warn(
        "Erreur lors de la suppression de l'image originale:",
        error.message
      );
    }

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get(
        'host'
      )}/images/${filenameOptimized}`,
    });

    await book.save(); // Renvoi d'une promise
    res.status(201).json({ message: 'Nouveau livre créé' });
  } catch (error) {
    console.error('Erreur lors de la création du livre :', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la création du livre.',
    });
  }
};

// Logique des modifications
exports.modifyBook = async (req, res, next) => {
  try {
    // Recherche du livre par ID
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    // Vérification que l'utilisateur est bien le propriétaire du livre
    if (book.userId != req.auth.userId) {
      return res.status(403).json({ message: '403: unauthorized request' });
    }

    let bookObject; //Préparation du nouvel objet

    if (req.file) {
      // Si une nouvelle image est envoyée, on traite avec Sharp comme dans le POST
      const filenameOptimized = `${book._id}.webp`;

      // Définir les chemins de sortie
      const outputPathImage = path.join('images', filenameOptimized);

      // Supprimer l'ancienne image si elle existe
      if (book.imageUrl) {
        const oldImage = book.imageUrl.split('/images/')[1];
        if (oldImage) {
          fs.unlink(`images/${oldImage}`, (error) => {
            if (error) {
              console.warn(
                "Erreur lors de la suppression de l'ancienne image:",
                error.message
              );
            }
          });
        }
      }

      // Utiliser Sharp pour compresser et redimensionner en deux versions
      await sharp(req.file.path)
        .resize({ width: 450, height: 580 }) // Ajuste à la taille de la galerie
        .webp({ quality: 80 })
        .toFile(outputPathImage);
      // Supprimer l’image originale non compressée
      try {
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.warn(
          "Erreur lors de la suppression de l'image originale:",
          error.message
        );
      }

      // Mettre à jour l'URL de l'image dans l'objet bookObject
      const parsedBook = req.body.book ? JSON.parse(req.body.book) : {};
      bookObject = {
        ...parsedBook,
        imageUrl: `${req.protocol}://${req.get(
          'host'
        )}/images/${filenameOptimized}`,
      };
    } else {
      // Si pas d'image, on récupère simplement le corps de la requête
      bookObject = req.body;
    }

    // On supprime le champ _userId pour éviter toute tricherie côté client
    delete bookObject._userId;

    // Mise à jour du livre avec les nouvelles données
    await Book.updateOne(
      { _id: req.params.id },
      { ...bookObject, _id: req.params.id }
    );

    console.log('Livre modifié avec succès');
    res.status(200).json({ message: 'Livre modifié' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du livre:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la modification du livre.',
    });
  }
};

//Logique des suppressions
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }

      const userId = req.auth.userId;
      if (book.userId != userId) {
        return res.status(403).json({ message: '403: unauthorized request' });
      }

      // Extraire les noms de fichiers depuis les URLs
      const image = book.imageUrl?.split('/images/')[1];

      // Vérification simple au cas où un fichier serait manquant
      if (!image) {
        return res
          .status(400)
          .json({ message: 'Fichiers image manquants dans les URLs.' });
      }

      // Supprimer l'image
      fs.unlink(`images/${image}`, (errorImage) => {
        if (errorImage)
          console.warn(
            'Erreur suppression image principale :',
            errorImage.message
          );

        // Supprimer le livre
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Livre supprimé' }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

//Logique de lecture d'un Book
exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(400).json({ error }));
};

//Logique de lecture de tous les books
exports.getAllBooks = (req, res, next) => {
  Book.find() //On renvoi un tableau à notre base de donnée avec tous les Boooks
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(400).json({ error }));
};

//Fonction de notation
exports.rateBook = async (req, res, next) => {
  try {
    const userId = req.auth.userId; // Récupération sécurisée de l'utilisateur connecté via le token
    const grade = req.body.rating; // Recupération de la notation du livre
    const bookId = req.params.id; //Récupération de l'ID du livre dans l'url

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    if (!bookId) {
      return res.status(400).json({ message: "L'ID du livre est manquant." });
    }
    //Vérification que la note est bien valide
    if (typeof grade !== 'number' || grade < 0 || grade > 5) {
      return res
        .status(400)
        .json({ message: 'La note doit être un nombre entre 0 et 5.' });
    }

    //Recherche du livre dans la base de donnée
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).send('Livre non trouvé');
    }

    //Vérification si le livre a déjà été noté ou non
    const alreadyRating = book.ratings.find(
      (rating) => rating.userId.toString() === userId
    );
    if (alreadyRating) {
      return res.status(400).send('Vous avez déjà noté ce livre');
    }

    //Ajout de la nouvelle notation
    book.ratings.push({ userId, grade });

    //Recalculer de la moyenne des notes
    const totalRatings = book.ratings.length;
    const additionOfRatings = book.ratings.reduce(
      (acc, rating) => acc + rating.grade,
      0
    );
    book.averageRating = additionOfRatings / totalRatings;

    //Sauvergarde du livre mis à jour
    const updatedBook = await book.save();
    return res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).send('Erreur interne du serveur');
  }
};

//Fonction pour classer les 3 livres les mieux notés
exports.getBestRatedBooks = async (req, res, next) => {
  try {
    const bestBooks = await Book.find() // récupère tous les livres
      .sort({ averageRating: -1 }) // trie du plus grand au plus petit average
      .limit(3); // garde les 3 premiers resultats

    res.status(200).json(bestBooks); // renvoie les livres au front
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
