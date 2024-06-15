const express = require('express');
const mongoose = require('mongoose');  // requiring the mongoose module
const passport = require('passport');  // requiring the passport module
const bodyParser = require('body-parser');  
const flash = require('connect-flash');
const session = require('express-session')
require('dotenv').config('./.env');
const app = express();

// Models
const Message = require('./models/Message');
const User = require('./models/Users');

// Atlas key
const url= `${process.env.url}`;
mongoose.connect(url, {
  useNewUrlParser: true,
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: 'Rusty is a dog',
  resave: false,
  saveUninitialized: false
}));


app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('public'));

// Profile page------------------------------------------------------------------------------------------
app.get('/profile', (req, res) => {
  const successMessage = req.flash('success');
  res.render('profile', { successMessage });
});


// router for login-register form---------------------------------------------------------------------------- 
app.get('/', function (req, res) {
  res.render('login',{imageFileName:'loginpic.jpg'});
});

app.post("/login",(req,res)=>{
  const username = req.body.email;
  const password = req.body.password;
  
  User.findOne({email : username}).then((foundUser) => {
    if(foundUser.password===password){
      req.session.user = foundUser.name;
      req.session.isLoggedIn = true;
      res.redirect('contact');
    }
    else{
      res.redirect('/');;
    }
  })
  .catch((err)=>{
    console.log(err);
    res.redirect('/');
  })     
});

// register page 
app.get('/register' , function(req,res){
  res.render('register',{imageFileName:'loginpic.jpg'});
});

app.post("/register", async (req,res)=>{

  const { email, name, password } = req.body;
  
  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      req.flash('error', 'User already exists with this email');
      return res.render('register', { imageFileName: 'loginpic.jpg', errorMessage: 'User already exists with this email' });
    }

    const newUser = new User({
      email,
      name,
      password
    });

    await newUser.save();
    req.session.user = newUser.name;
    req.session.isLoggedIn = true;
    res.redirect('contact');
  } catch(err){
    console.log("Error: koi to gadbad hai");
    res.render('register');
  }
});
// Contact Page------------------------------------------------------------------------------------

app.get('/contact', async (req, res) => {
  if(req.session.isLoggedIn){
    const users = await User.find().sort({ name: 'asc' });
    res.render('contact',{users,user: req.session.user});
  }
  else{
    res.redirect('/');
  }
});

app.post('/companion', async (req, res) => {
  req.session.friend = req.body.option;
  res.redirect('/forum');
});

// Forum data---------------------------------------------------------------------------------------

app.get('/forum', async (req, res) => {
  if(req.session.isLoggedIn){
    try {
      res.render('discuss', { user: req.session.user, friend: req.session.friend });
      } catch (err) {
        console.error(err);
      res.status(500).send('Internal Server Error');
      }
  }
  else{
    res.redirect('/');
  }
});

// New experiment----------------
app.get('/chats', async (req, res) => {
  const user = req.session.user;
  const friend = req.session.friend;

  const chats = await Message.find({$or: [{ user1: user, user2: friend },{ user1: friend, user2: user }]}).sort({ 'messages.timestamp': 1 });
  
  if (chats.length > 0) {
      res.json(chats[0].messages);
  } else {
      res.json([]);
  }
});

// Add a new message between user1 and user2
app.post('/chats', async (req, res) => {
  const { message } = req.body;
  const user = req.session.user;
  const friend = req.session.friend;

  let chat = await Message.findOne({
      $or: [
          { user1: user, user2: friend },
          { user1: friend, user2: user }
      ]
  });

  if (!chat) {
    if(user < friend){
      chat = new Message({ user1:user, user2:friend, messages: [] });
    }
    else{
      chat = new Message({ user1:friend, user2:user, messages: [] });
    }
      
  }
  chat.messages.push({Author: user, message });
  await chat.save();
  res.json(chat);
});

//Handling user logout------------------------------------------------------------------------------

app.get("/logout", function (req, res) {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// ------------------------------------------------------------------------------------------------------
var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});