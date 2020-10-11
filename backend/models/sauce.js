const mongoose = require("mongoose");

const sauceSchema = mongoose.Schema({
  //id: { type: String, required: true }, //Généré par mongoose?
  userId: { type: String },
  name: { type: String, required: true },
  manufacturer: { String },
  description: { type: String },
  mainPepper: { type: String },
  imageUrl: { type: String },
  heat: { type: Number },
  likes: { type: Number },
  dislikes: { type: Number },
  usersLiked: [{ type: String }],
  usersDisliked: [{ type: String }],
});

module.exports = mongoose.model("Sauce", sauceSchema);
