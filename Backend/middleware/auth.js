//Import du package jsonwebtoken
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res
        .status(401)
        .json({ message: 'En-tête Authorization manquant' });
    }

    const token = authHeader.split(' ')[1]; //Extraction du token du header Authorization
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET); //Vérification de la validité du token
    const userId = decodedToken.userId;
    req.auth = {
      userId: userId,
    };
    next();
  } catch (error) {
    console.error("Erreur d'authentification:", error); // Log pour l'erreur exacte
    res.status(401).json({ error });
  }
};
