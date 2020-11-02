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
        return res.status(401).json({ error: "Utilisateur non trouvé !" });
      }
      // Test if the account is already locked
      if (functions.checkIfAccountIsLocked(user.lockUntil)) {
        console.log("Le compte est déjà bloqué");
        let waitingTime = (user.lockUntil - Date.now()) / 1000 / 60;
        return res.status(401).json({
          error: "Compte bloqué, revenez dans: " + waitingTime + " minutes",
        });
      } else {
        console.log("Le compte n'est pas bloqué");
      }

      // If the lockUntil is finished => reset loginAttempt
      if (user.lockUntil && user.lockUntil <= Date.now()) {
        // Reset of loginAttempt
        console.log(
          "Le compte était bloqué mais la date est dépassé => reset des loginAttempt"
        );
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
                    .json({ error: "Mot de passe incorrect !" });
                }
                
                 else {
                  // Just send the token
                  console.log("User connecté, envoi d'un simple token");
                  functions.sendNewToken(user._id, res)
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
            console.log("n'a pas fait de reset");
            // If it's a wrong password and the connection attempt is reached, then block the account
            if (!valid && user.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
              console.log("N'a pas fait de reset de loginAttempt");
              console.log(
                "Limite d'essai de connection atteinte, blockage du compte"
              );
              functions
                .blockUserAccount(emailHashed)
                .catch((error) => console.log({ error }));
              return res.status(401).json({
                error:
                  "Mot de passe incorrect ! Vous avez atteind le nombre maximum d'essai, votre compte est maintenant bloqué!",
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
                .json({ error: "Mot de passe incorrect !" });
            }
            // If the user is connected but had loginAttempt > 0 => reset try
            if (user.loginAttempts > 0) {
              console.log("User connecté, reset des try + envoi du token");
              functions
                .resetUserLockAttempt(emailHashed)
                .then(() => {
                  functions.sendNewToken(user._id, res);
                })
                .catch((error) => console.log({ error }));
            }else{
              // Just send a new token
              console.log("User connecté, envoi du token");
              console.log(user._id);
              
                functions.sendNewToken(user._id, res);
              //.catch((error) => console.log({ error }));
            }
            
          })
          .catch((error) => res.status(500).json({ error }));
      }
    })
    .catch((error) => res.status(500).json({ error }));
};
