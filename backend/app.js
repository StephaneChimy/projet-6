const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Sauce = require("./models/sauce");
const saucesRoutes = require("./routes/sauces");
const userRoutes = require("./routes/user");
const path = require("path");
// Add configuration file
const config = require('./config');
// Add the mongoose-morgan package for logs into mongoDB
const mongooseMorgan = require("mongoose-morgan");
// Data Sanitization against XSS
const xss = require('xss-clean');
// Add 14 middleware to prevent few attacks
const helmet = require('helmet');
// Data Sanitization against NoSQL Injection Attacks
const mongoSanitize = require('express-mongo-sanitize');

const app = express();
// Helmet
app.use(helmet());

//debug mod of mongoose
mongoose.set('debug', true);
//


// connexion to mongoDB
mongoose
  .connect(
    "mongodb+srv://" + config.user + ":" + config.password + "@cluster0.jamfu.mongodb.net/project6?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }
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

// Data Sanitization against NoSQL Injection Attacks
app.use(mongoSanitize());

// Prevent DOS attacks
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb
//
// Data Sanitization against XSS attacks
app.use(xss());

// Add logs with mongoose-morgan
// Personalise logs => Only record requests having a value under 400
mongooseMorgan.token('body', (req, res) => JSON.stringify(req.body));
mongooseMorgan.token('req', (req, res) => JSON.stringify(req.headers.authorization));
app.use(
  mongooseMorgan({
    connectionString:
      "mongodb+srv://" + config.user + ":" + config.password + "@cluster0.jamfu.mongodb.net/project6?retryWrites=true&w=majority",
  }, {skip: function (req, res) { return res.statusCode < 400 }}, 'date:date status::status method::method url::url body::body remote-addr::remote-addr referrer::referrer'
  )
);
//


app.use("/api/auth", userRoutes);
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/sauces", saucesRoutes);

module.exports = app;
