const mongoose = require("mongoose");
// Add history plugin for mongoose
const diffHistory = require('mongoose-diff-history/diffHistory');
//

const sauceSchema = mongoose.Schema({
  //id: { type: String, required: true }, //Généré par mongoose?
  userId: { type: String, required: true },
  name: { type: String, required: true },
  manufacturer: { type: String, required: true },
  description: { type: String, required: true },
  mainPepper: { type: String, required: true },
  imageUrl: { type: String, required: true },
  heat: { type: String, required: true },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  usersLiked: [{ type: String }],
  usersDisliked: [{ type: String }],
});

// Use mongoose history to create logs in histories collection database
sauceSchema.plugin(diffHistory.plugin);
//

module.exports = mongoose.model("Sauce", sauceSchema);
