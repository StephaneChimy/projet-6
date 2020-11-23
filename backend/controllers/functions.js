const User = require("../models/user");
const jwt = require("jsonwebtoken");
// 2 hours of lock
//const LOCK_TIME = 2 * 60 * 60 * 1000;
// 1 minutes of lock
const LOCK_TIME = 60 * 1000;
//

function checkPassword(password) {
  // Here minimum 4 characters, at least one letter and one number
  // This needs to be changed in production with a minimum of 8 characters and a maximum.
  const regularExp = RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{4,}$");
  if (regularExp.test(password)) {
    console.log("Strong password!");
    return true;
  } else {
    console.log("Weak password!");
    return false;
  }
}

function checkIfAccountIsLocked(userLockUntil) {
  if (userLockUntil && userLockUntil > Date.now()) {
    return true;
  } else {
    return false;
  }
}

function incrementLoginAttempt(emailHashed) {
  return User.updateOne(
    { emailHash: emailHashed },
    {
      $inc: { loginAttempts: 1 },
    }
  );
}

function blockUserAccount(emailHashed) {
  return User.updateOne(
    { emailHash: emailHashed },
    {
      $inc: { loginAttempts: 1 },
      $set: { lockUntil: Date.now() + LOCK_TIME },
    }
  );
}

function resetUserLockAttempt(emailHashed) {
  return User.updateOne(
    { emailHash: emailHashed },
    {
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 },
    }
  );
}

function sendNewToken(userId, res) {
  return res.status(200).json({
    userId: userId,
    token: jwt.sign({ userId: userId }, "RANDOM_TOKEN_SECRET", {
      expiresIn: "24h",
    }),
  });
}

exports.checkPassword = checkPassword;
exports.checkIfAccountIsLocked = checkIfAccountIsLocked;
exports.sendNewToken = sendNewToken;
exports.resetUserLockAttempt = resetUserLockAttempt;
exports.incrementLoginAttempt = incrementLoginAttempt;
exports.blockUserAccount = blockUserAccount;
