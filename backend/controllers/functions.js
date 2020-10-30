function checkPassword(password) {
  //Minimum eight characters, at least one letter and one number
  const regularExp = RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{4,}$");
  if (regularExp.test(password)) {
    console.log("Strong password!");
    return true;
  } else {
    console.log("Weak password!");
    return false;
  }
}

// function checkIfAccountIsLocked(userLockUntil){
//   console.log("Vérification du blockage de compte")
//       if (userLockUntil && userLockUntil > Date.now()){
//         console.log("Le compte est déjà bloqué");
//         let waitingTime = ((userLockUntil) - Date.now())/1000/60;
//         return res.status(401).json({ error: 'Compte bloqué, revenez dans: ' + waitingTime + " minutes" });
//       }else{
//         console.log("Le compte n'est pas bloqué");
//       }
// }

function checkIfAccountIsLocked(userLockUntil){
  if (userLockUntil && userLockUntil > Date.now()){
  return true;
  }else{
    return false;
  }
}


function sendNewToken(reqUserId){
  res.status(200).json({
    userId: reqUserId,
    token: jwt.sign({ userId: reqUserId }, "RANDOM_TOKEN_SECRET", {
      expiresIn: "24h",
    }),
  });
}


exports.checkPassword = checkPassword;
exports.checkIfAccountIsLocked = checkIfAccountIsLocked;
exports.sendNewToken = sendNewToken;
