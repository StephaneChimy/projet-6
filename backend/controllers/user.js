const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cryptoJS = require("crypto-js");
const fonctions = require("./fonctions");

exports.signup = (req, res, next) => {
  // Get emails in database to check if it already exist
  User.find()
    .then((users) => {
      let emailFound = false;
      for (index = 0; index < users.length; index++) {
        let decryptedEmail = cryptoJS.AES.decrypt(
          users[index].email,
          "Secret Passphrase"
        );
        decryptedEmail = decryptedEmail.toString(cryptoJS.enc.Utf8);
        console.log(decryptedEmail);
        if (decryptedEmail === req.body.email) {
          emailFound = true;
          console.log(emailFound);
          if (emailFound === true) {
            return res
              .status(401)
              .json({ error: "Utilisateur déjà utilisé !" });
          }
        }
      }
      console.log(emailFound);
      if (!emailFound) {
        //Encrypt the email with crypto-js ( Secret passphrase needs to be changed in production )
        const emailEncrypted = cryptoJS.AES.encrypt(
          req.body.email,
          "Secret Passphrase"
        );
        //

        // Check password security
        if (fonctions.checkPassword(req.body.password)) {
          bcrypt
            .hash(req.body.password, 10)
            .then((hash) => {
              const user = new User({
                email: emailEncrypted,
                password: hash,
              });
              user
                .save()
                .then(() =>
                  res.status(201).json({ message: "Utilisateur créé !" })
                )
                .catch((error) => res.status(400).json({ error }));
            })
            .catch((error) => res.status(500).json({ error }));
        } else {
          return res.status(401).json({ error: "Password trop faible !" });
        }
      }
    })
    .catch((error) => res.status(500).json({ error }));
  //
};

exports.login = (req, res, next) => {
  // Recupération des emails pour décryptage
  User.find()
    .then((users) => {
      let emailFound = false;
      //let decryptedEmails = [];
      for (index = 0; index < users.length; index++) {
        let decryptedEmail = cryptoJS.AES.decrypt(
          users[index].email,
          "Secret Passphrase"
        );
        decryptedEmail = decryptedEmail.toString(cryptoJS.enc.Utf8);
        console.log(decryptedEmail);
        if (decryptedEmail === req.body.email) {
          emailFound = true;
          if (emailFound === true) {
            User.findOne({ email: users[index].email })
              .then((user) => {
                // if (!user) {
                //   return res
                //     .status(401)
                //     .json({ error: "Utilisateur non trouvé !" });
                // }
                bcrypt
                  .compare(req.body.password, user.password) // req.body.password
                  .then((valid) => {
                    if (!valid) {
                      return res
                        .status(401)
                        .json({ error: "Mot de passe incorrect !" });
                    }
                    res.status(200).json({
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
                  .catch((error) => res.status(500).json({ error }));
              })
              .catch((error) => res.status(500).json({ error }));
          }
        }
      }

      console.log(emailFound);
      if (!emailFound) {
        return res.status(401).json({ error: "Utilisateur non trouvé !" });
      }
    })
    .catch((error) => res.status(500).json({ error }));
  //

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
};
