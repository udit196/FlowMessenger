const express = require('express');
const mongoose = require('mongoose');   
const bodyParser = require('body-parser'); 
const session = require('express-session');
const path = require('path');
require('dotenv').config('./.env');
const app = express();

// Models
const passport = require('./auth/passportConfig');

// MongoDb
const url= process.env.url;
mongoose.connect(url);

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 5// 5 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const contactRoutes = require('./routes/contact');

// Use routes
app.use(authRoutes);
app.use(profileRoutes);
app.use(contactRoutes);

app.get('/', function (req, res) {
  // if(req.isAuthenticated()){
  //   req.logout((err) => {
  //     if (err) return next(err);
  //   });
  // }
  res.sendFile(path.join(__dirname, 'public', 'get-started.html'));
});

// ------------------------------------------------------------------------------------------------------
var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});