//Import de mongoose
const mongoose = require('mongoose');
//Import du package unique-validator de mongoose
const uniqueValidator = require('mongoose-unique-validator');

//Utilisation de Schema
const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true }, //Ajout de Unique pour eviter les memes adresses emails
  password: { type: String, required: true },
});

//Application du validateur au schema
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
