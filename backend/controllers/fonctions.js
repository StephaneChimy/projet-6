function checkPassword(password) {
    //Minimum eight characters, at least one letter and one number
    const regularExp = RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$");
    if (regularExp.test(password)) {
      console.log("Strong password!");
      return true;
    } else {
      console.log("Weak password!");
      return false;
    }
  }
  
exports.checkPassword = checkPassword;