const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Sauce = require("./models/sauce");
const saucesRoutes = require("./routes/sauces");
const userRoutes = require("./routes/user");
const path = require("path");
//Add the mongoose-morgan package for logs into mongoDB
const mongooseMorgan = require("mongoose-morgan");
//


const app = express();

//debug mod
mongoose.set('debug', true);
//


// connexion to mongoDB
mongoose
  .connect(
    "mongodb+srv://user:user@cluster0.jamfu.mongodb.net/project6?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

// Add CORS in the headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use(bodyParser.json());

// Add logs with mongoose-morgan
// Personnalise logs => n'enregistre que les requêtes ayant un status inférieur à 400
mongooseMorgan.token('body', (req, res) => JSON.stringify(req.body));
//mongooseMorgan.token('req', (req, res) => JSON.stringify(req.headers.authorization));
app.use(
  mongooseMorgan({
    connectionString:
      "mongodb+srv://user:user@cluster0.jamfu.mongodb.net/project6?retryWrites=true&w=majority",
  }, {skip: function (req, res) { return res.statusCode < 400 }}, 'date:date status::status method::method url::url body::body remote-addr::remote-addr referrer::referrer'
  )
);
//


app.use("/api/auth", userRoutes);
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/sauces", saucesRoutes);

module.exports = app;
