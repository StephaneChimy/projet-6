const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cryptoJS = require("crypto-js");
const functions = require("./functions");

// Variables used to verify / lock a user
const MAX_LOGIN_ATTEMPTS = 5;

exports.signup = (req, res, next) => {
  // Hash the email the have a unique validation
  let emailHashed = cryptoJS.MD5(req.body.email).toString();
  // Encrypt the email with crypto-js ( Secret passphrase needs to be changed in production )
  let emailEncrypted = cryptoJS.AES.encrypt(
    req.body.email,
    "Secret Passphrase"
  );
  //

  // Check password security
  if (functions.checkPassword(req.body.password)) {
    bcrypt
      .hash(req.body.password, 10)
      .then((hash) => {
        const user = new User({
          email: emailEncrypted,
          emailHash: emailHashed,
          password: hash,
        });
        user
          .save()
          .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
          .catch((error) => res.status(400).json({ error }));
      })
      .catch((error) => res.status(500).json({ error }));
  } else {
    return res.status(401).json({ error: "Password trop faible !" });
  }
};

exports.login = (req, res, next) => {
  // Hash the email to find it in the database
  let emailHashed = cryptoJS.MD5(req.body.email).toString();
  //
  User.findOne({ emailHash: emailHashed })
    .then((user) => {
      // If the user is not found return error
      if (!user) {
        return res
          .status(401)
          .json({ error: "Nom d'utilisateur (ou mot de passe) incorrect" });
      }
      // Test if the account is already locked
      if (functions.checkIfAccountIsLocked(user.lockUntil)) {
        let waitingTime = (user.lockUntil - Date.now()) / 1000 / 60;
        return res.status(401).json({
          error: "Compte bloqué, revenez dans: " + waitingTime + " minutes",
        });
      }

      // If the lockUntil is finished => reset loginAttempt
      if (user.lockUntil && user.lockUntil <= Date.now()) {
        // Reset of loginAttempt
        functions
          .resetUserLockAttempt(emailHashed)
          //
          .then(() => {
            bcrypt
              .compare(req.body.password, user.password)
              .then((valid) => {
                // If the password is wrong but the max connection attempt is not reached, then increment the loginAttempt by 1
                if (!valid) {
                  // Increment value to the loginAttempts
                  functions
                    .incrementLoginAttempt(emailHashed)
                    .catch((error) => console.log({ error }));
                  //
                  return res
                    .status(401)
                    .json({ error: "Mot de passe (ou email) incorrect !" });
                } else {
                  // User connected, send a simple toker
                  functions.sendNewToken(user._id, res);
                  //.catch((error) => console.log({ error }));
                  //
                }
              })
              .catch((error) => res.status(500).json({ error }));
          })
          .catch((error) => console.log({ error }));
        //
      } else {
        // If the account wasn't blocked continue
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            // If it's a wrong password and the connection attempt is reached, then block the account
            if (!valid && user.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
              console.log(
                "Limite d'essai de connection atteinte, blockage du compte"
              );
              functions
                .blockUserAccount(emailHashed)
                .catch((error) => console.log({ error }));
              return res.status(401).json({
                error:
                  "Mot de passe (ou email) incorrect ! Vous avez atteint le nombre maximum d'essai, votre compte est maintenant bloqué!",
              });
            }
            // If the password is wrong but the max connection attempt is not reached, then increment the loginAttempt by 1
            if (!valid && user.loginAttempts + 1 < MAX_LOGIN_ATTEMPTS) {
              // Increment value to the loginAttempts
              functions
                .incrementLoginAttempt(emailHashed)
                .catch((error) => console.log({ error }));
              //
              return res
                .status(401)
                .json({ error: "Mot de passe (ou email) incorrect !" });
            }
            // If the user is connected but had loginAttempt > 0 => reset try + send token
            if (user.loginAttempts > 0) {
              functions
                .resetUserLockAttempt(emailHashed)
                .then(() => {
                  functions.sendNewToken(user._id, res);
                })
                .catch((error) => console.log({ error }));
            } else {
              // Just send a new token
              functions.sendNewToken(user._id, res);
            }
          })
          .catch((error) => res.status(500).json({ error }));
      }
    })
    .catch((error) => res.status(500).json({ error }));
};
