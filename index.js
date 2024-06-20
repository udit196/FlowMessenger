const express = require('express');
const mongoose = require('mongoose');   
const bodyParser = require('body-parser');  
const flash = require('connect-flash');
const session = require('express-session')
require('dotenv').config('./.env');

const app = express();

// Models
const Message = require('./models/Message');
const User = require('./models/Users');
const passport = require('./auth/passportConfig');


// Atlas key
const url= process.env.url;
mongoose.connect(url);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));


app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));


app.get('/', function (req, res) {
  res.render('get-started',{backButton:'back-button.png',imageFileName:'BgHome.jpg'});
});

// router for login-register form---------------------------------------------------------------------------- 
app.get('/login', function (req, res) {
  res.render('login',{imageFileName:'loginpic.jpg'});
});

app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/'}),
  async function(req, res) {
    const username = req.body.username;
    const user = await User.findOne({ username });
    req.session.name = user.name;
    req.session.user = req.body.username;
    res.redirect('/contact');
  });

// register page--------------------------------------------------------------------------------------- 
app.get('/register' , function(req,res){
  res.render('register',{imageFileName:'loginpic.jpg'});
});

app.post("/register", async (req,res)=>{
  const { username, name, password } = req.body;
  
  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      req.flash('error', 'User already exists with this email');
      return res.render('register', { imageFileName: 'loginpic.jpg', errorMessage: 'User already exists with this email' });
    }

    const newUser = new User({
      username,
      name,
      password
    });

    await newUser.save();

    req.login(newUser, function(err) {
      if (err) {
        console.log('Error: ', err);
        return res.redirect('register');
      }
      req.session.name = req.body.name;
      req.session.user = req.body.username;
      return res.redirect('/contact');
    });

  } catch(err){
    console.log("Error: koi to gadbad hai");
    res.redirect('register');
  }
});

// Profile page------------------------------------------------------------------------------------------
app.get('/profile', async (req, res) => {
  if (req.isAuthenticated()) {
    res.render('profile', { user: req.session.user, user_name: req.session.name, errorMessage: req.flash('error'), successMessage: req.flash('success') });
  } else {
    res.redirect('/');
  }
});

app.post('/profile', async (req, res) => {
  const { name,password } = req.body;
  try {
    const user = await User.findOne({username:req.session.user});
    if (user) {
      user.name = name || user.name;
      if (password) {
        user.password = password;
      }
      await user.save();
      req.flash('success', 'Profile updated successfully');
    } else {
      req.flash('error', 'User not found');
    }
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while updating the profile');
  }
  res.redirect('/profile');
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//Image upload
app.post('/upload', upload.single('image'), async (req, res) => {

  try {
    const user = await User.findOne({username:req.session.user});
    if (user) {

      user.dp.data = req.file.buffer;
      user.dp.contentType = req.file.mimetype;
      await user.save();
      req.flash('success', 'Image uploaded successfully');

    } else {
      req.flash('error', 'User not found');
    }
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while updating the profile');
  }
  res.redirect('/profile');
});

// Endpoint to display a single image
app.get('/image', async (req, res) => {
  try {
    const user = await User.findOne({username:req.session.user});
    res.contentType(user.dp.contentType);
    console.log(user.dp.data);
    res.send(user.dp.data);
  } catch (err) {
    res.status(500).send('Error retrieving image');
  }
});

// Contact Page------------------------------------------------------------------------------------
app.get('/contact', async (req, res) => {
  if(req.isAuthenticated()){
    const users = await User.find().sort({ name: 'asc' });
    res.render('contact',{users,user: req.session.user,dp:"dp.png"});
  }
  else{
    res.redirect('/login');
  }
});

app.post('/contact', async (req, res) => {
  req.session.friend = req.body.option;
  res.redirect('/chatbox');
});

// Forum Page---------------------------------------------------------------------------------------
app.get('/chatbox', async (req, res) => {
  if(req.isAuthenticated()){
    try {
      const friend = await User.findOne({ username: req.session.friend });
      friend_name = friend.name;
      res.render('chatbox', { user:req.session.user,user_name: req.session.user, friend: req.session.friend,friend_name, sendButton:'send-button.png', backButton:'back-button.png'});
      } catch (err) {
        console.error(err);
      res.status(500).send('Internal Server Error');
      }
  }
  else{
    res.redirect('/login');
  }
});

// Ajax data---------------------------------------------------------------------------------------
// Get Message
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

// Add New Message
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

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// ------------------------------------------------------------------------------------------------------
var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});