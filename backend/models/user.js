const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
// Add history plugin for mongoose
const diffHistory = require('mongoose-diff-history/diffHistory');
//

const userSchema = mongoose.Schema({
  //id: { type: String, required: true },
  email: { type: String, required: true },
  emailHash: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // new properties for security
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Number },
  //
  
});

userSchema.plugin(uniqueValidator);

// Use mongoose history to create logs in histories collection database
userSchema.plugin(diffHistory.plugin);

//

module.exports = mongoose.model("User", userSchema);
