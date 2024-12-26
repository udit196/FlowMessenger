const express = require('express');
const passport = require('../auth/passportConfig');
const User = require('../models/Users');
const Message = require('../models/Message');
const path = require('path');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();

// Contact Page------------------------------------------------------------------------------------
router.get('/contact', async (req, res) => {
  if(req.isAuthenticated()){
    res.sendFile(path.join(__dirname, '../public', 'contact.html'));
  }
  else{
    res.redirect('/login');
  }
});

//Get All Friends----------------------------------------------------------------------------------
router.get('/friends', async (req,res) =>{
    if(req.isAuthenticated()){
        const users = await User.find().sort({ name: 'asc' });
        res.json(users);
    }
    else{
        res.redirect('/login');
    }
});

// Get User image---------------------------------------------------------------------------------
router.get('/User-Image', async (req, res) => {
  if(req.isAuthenticated()){
    try {
      const user = await User.findById(req.session.passport.user);
      res.contentType(user.dp.contentType);
      res.send(user.dp.data);

    } catch (err) {
      res.status(500).send('Error retrieving image');

    }
  }
  else{
    res.redirect('/login');
  }
});

router.get('/chatbox', async (req, res) => {
  if(req.isAuthenticated()){
    try {
        res.sendFile(path.join(__dirname, 'public', 'chatbox.html'));

      } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');

      }
  }
  else{
    res.redirect('/login');
  }
});

// Endpoint to display Friend image-----------------------------------------------------------------
router.get('/api/friendImage', async (req, res) => {
  try {
    const friendId = req.query.id;
    const friend = await User.findById(friendId);
    // Send the binary image as Base64
    res.set('Content-Type', 'image/png'); // Change to the appropriate format if necessary
    res.send(friend.profilePicture);
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    res.status(500).send({ message: 'Error fetching profile picture' });
  }
});

// Ajax data---------------------------------------------------------------------------------------
// Get Messages
router.get('/chats', async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.session.passport.user;
    const friend = req.query.friendId;

    const chats = await Message.findOne({$or: [{ user1: user, user2: friend },{ user1: friend, user2: user }]}).sort({ 'messages.timestamp': 1 });

    if (chats) {
        res.json(chats);
    } else {
        res.json([]);
    } 
  } else {
    res.redirect('/');
  }
});

// Add new message--------------------------------------------------------------------------------
router.post('/chats', async (req, res) => {
  if (req.isAuthenticated()) {
    const { message } = req.body;
    const user = await req.session.passport.user;
    const friend = await req.query.friendId;

    let chat = await Message.findOne({
        $or: [
            { user1: user, user2: friend },
            { user1: friend, user2: user }
        ]
    });

    if (!chat) {
      const user1 = await User.findById(user);
      const user2 = await User.findById(friend);

      chat = new Message({ user1:user, user2:friend, user1_name:user1.name, user2_name:user2.name, messages: [] }); 
    }

    chat.messages.push({Author: user, message });
    await chat.save();
    res.json(chat);
  } else {
    res.redirect('/');
  }
});

module.exports = router;