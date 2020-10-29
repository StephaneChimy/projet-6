const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
// Add history plugin for mongoose
const mongooseHistory = require('mongoose-history');
//

const userSchema = mongoose.Schema({
  //id: { type: String, required: true },
  email: { type : String, required: true},
  emailHash: { type: String, required: true, unique: true},
  password: { type: String, required: true},
  
});

userSchema.plugin(uniqueValidator);

// Use mongoose history to create logs in database
let options = {indexes: [{'t': -1, 'd._id': 1}]};
userSchema.plugin(mongooseHistory, options);
//


module.exports = mongoose.model("User", userSchema);
