const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cryptoJS = require("crypto-js");
const functions = require("./functions");

// Variables used to verify / lock a user
const MAX_LOGIN_ATTEMPTS = 5;
// 2 hours of lock
//const LOCK_TIME = 2 * 60 * 60 * 1000;
// 2 minutes of lock
const LOCK_TIME = 2 * 60 * 1000;
//

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
      try {
        if (functions.checkIfAccountIsLocked(user.lockUntil)) {
          console.log("Le compte est déjà bloqué");
          let waitingTime = (user.lockUntil - Date.now()) / 1000 / 60;
          return res.status(401).json({
            error: "Compte bloqué, revenez dans: " + waitingTime + " minutes",
          });
        } else {
          console.log("Le compte n'est pas bloqué");
        }
      } catch (e) {
        console.log(e);
      }

      // If the lockUntil is finished => reset loginAttempt
      if (user.lockUntil && user.lockUntil <= Date.now()) {
        // Reset of loginAttempt
        console.log(
          "Le compte était bloqué mais la date est dépassé => reset des loginAttempt"
        );
        User.updateOne(
          { emailHash: emailHashed },
          {
            $set: { loginAttempts: 0 },
            $unset: { lockUntil: 1 },
          }
        )
          .then(() => {
            bcrypt
              .compare(req.body.password, user.password)
              .then((valid) => {
                // If the password is wrong but the max connection attempt is not reached, then increment the loginAttempt by 1
                if (!valid) {
                  // Increment value to the loginAttempts
                  User.updateOne(
                    { emailHash: emailHashed },
                    {
                      $inc: { loginAttempts: 1 },
                    }
                  ).catch((error) => console.log({ error }));
                  //
                  return res
                    .status(401)
                    .json({ error: "Mot de passe incorrect !" });
                } else {
                  // Reset value of loginAttempts
                  console.log("User connecté, reset des try");
                  User.updateOne(
                    { emailHash: emailHashed },
                    {
                      $set: { loginAttempts: 0 },
                      $unset: { lockUntil: 1 },
                    }
                  )
                    .then(() => {
                      return res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                          { userId: user._id },
                          "RANDOM_TOKEN_SECRET",
                          {
                            expiresIn: "24h",
                          }
                        ),
                      });
                    })
                    .catch((error) => console.log({ error }));
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
              console.log("N'a pas fait de reset de loginAttempt");
              console.log(
                "Limite d'essai de connection atteinte, blockage du compte"
              );
              User.updateOne(
                { emailHash: emailHashed },
                {
                  $inc: { loginAttempts: 1 },
                  $set: { lockUntil: Date.now() + LOCK_TIME },
                }
              ).catch((error) => console.log({ error }));
              return res.status(401).json({
                error:
                  "Mot de passe incorrect ! Vous avez atteind le nombre maximum d'essai, votre compte est maintenant bloqué!",
              });
            }
            // If the password is wrong but the max connection attempt is not reached, then increment the loginAttempt by 1
            if (!valid && user.loginAttempts + 1 < MAX_LOGIN_ATTEMPTS) {
              // Increment value to the loginAttempts
              User.updateOne(
                { emailHash: emailHashed },
                {
                  $inc: { loginAttempts: 1 },
                }
              ).catch((error) => console.log({ error }));
              //
              return res
                .status(401)
                .json({ error: "Mot de passe incorrect !" });
            }
            // Reset value of loginAttempts
            console.log("User connecté, reset des try");
            User.updateOne(
              { emailHash: emailHashed },
              {
                $set: { loginAttempts: 0 },
                $unset: { lockUntil: 1 },
              }
            )
              .then(() => {
                res.status(200).json({
                  userId: user._id,
                  token: jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
                    expiresIn: "24h",
                  }),
                });
              })
              .catch((error) => console.log({ error }));
            //
          })
          .catch((error) => res.status(500).json({ error }));
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

// exports.login = (req, res, next) => {
//   // Recupération des emails pour décryptage
//   User.find()
//     .then((users) => {
//       let emailFound = false;
//       //let decryptedEmails = [];
//       for (index = 0; index < users.length; index++) {
//         let decryptedEmail = cryptoJS.AES.decrypt(
//           users[index].email,
//           "Secret Passphrase"
//         );
//         decryptedEmail = decryptedEmail.toString(cryptoJS.enc.Utf8);
//         console.log(decryptedEmail);
//         if (decryptedEmail === req.body.email) {
//           emailFound = true;
//           if (emailFound === true) {
//             User.findOne({ email: users[index].email })
//               .then((user) => {
//                 // if (!user) {
//                 //   return res
//                 //     .status(401)
//                 //     .json({ error: "Utilisateur non trouvé !" });
//                 // }
//                 bcrypt
//                   .compare(req.body.password, user.password) // req.body.password
//                   .then((valid) => {
//                     if (!valid) {
//                       return res
//                         .status(401)
//                         .json({ error: "Mot de passe incorrect !" });
//                     }
//                     res.status(200).json({
//                       userId: user._id,
//                       token: jwt.sign(
//                         { userId: user._id },
//                         "RANDOM_TOKEN_SECRET",
//                         {
//                           expiresIn: "24h",
//                         }
//                       ),
//                     });
//                   })
//                   .catch((error) => res.status(500).json({ error }));
//               })
//               .catch((error) => res.status(500).json({ error }));
//           }
//         }
//       }

//       console.log(emailFound);
//       if (!emailFound) {
//         return res.status(401).json({ error: "Utilisateur non trouvé !" });
//       }
//     })
//     .catch((error) => res.status(500).json({ error }));
//   //
// };

// .catch((error) => {
//   res.status(400).json({
//     error: error,
//   });
// });
//

// User.findOne({ email: req.body.email })
//   .then((user) => {
//     if (!user) {
//       return res.status(401).json({ error: "Utilisateur non trouvé !" });
//     }
//     bcrypt
//       .compare(req.body.password, user.password) // req.body.password
//       .then((valid) => {
//         if (!valid) {
//           return res.status(401).json({ error: "Mot de passe incorrect !" });
//         }
//         res.status(200).json({
//           userId: user._id,
//           token: jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
//             expiresIn: "24h",
//           }),
//         });
//       })
//       .catch((error) => res.status(500).json({ error }));
//   })
//   .catch((error) => res.status(500).json({ error }));

// exports.signup = (req, res, next) => {
//   // Get emails in database to check if it already exist
//   User.find()
//     .then((users) => {
//       let emailFound = false;
//       for (index = 0; index < users.length; index++) {
//         let decryptedEmail = cryptoJS.AES.decrypt(
//           users[index].email,
//           "Secret Passphrase"
//         );
//         decryptedEmail = decryptedEmail.toString(cryptoJS.enc.Utf8);
//         console.log(decryptedEmail);
//         if (decryptedEmail === req.body.email) {
//           emailFound = true;
//           console.log(emailFound);
//           if (emailFound === true) {
//             return res
//               .status(401)
//               .json({ error: "Utilisateur déjà utilisé !" });
//           }
//         }
//       }
//       console.log(emailFound);
//       if (!emailFound) {
//         //Encrypt the email with crypto-js ( Secret passphrase needs to be changed in production )
//         const emailEncrypted = cryptoJS.AES.encrypt(
//           req.body.email,
//           "Secret Passphrase"
//         );
//         //

//         // Check password security
//         if (functions.checkPassword(req.body.password)) {
//           bcrypt
//             .hash(req.body.password, 10)
//             .then((hash) => {
//               const user = new User({
//                 email: emailEncrypted,
//                 password: hash,
//               });
//               user
//                 .save()
//                 .then(() =>
//                   res.status(201).json({ message: "Utilisateur créé !" })
//                 )
//                 .catch((error) => res.status(400).json({ error }));
//             })
//             .catch((error) => res.status(500).json({ error }));
//         } else {
//           return res.status(401).json({ error: "Password trop faible !" });
//         }
//       }
//     })
//     .catch((error) => res.status(500).json({ error }));
//   //
// };
