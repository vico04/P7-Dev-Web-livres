//Import de multer
const multer = require('multer');

//Dictionnaire pour l'extention
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
};

//Creation d'un objet de configuration pour multer
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },

  filename: (req, file, callback) => {
    const name = file.originalname;
    const extension = MIME_TYPES[file.mimetype]; // recupération de la constante mimetypes
    callback(null, name + Date.now() + '.' + extension);
  },
});

module.exports = multer({ storage: storage }).single('image');
