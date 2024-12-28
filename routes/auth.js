const express = require('express');
const passport = require('../auth/passportConfig');
const User = require('../models/Users');
const path = require('path');
const router = express.Router();

// Login route
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

router.post(
  '/login',
  passport.authenticate('local', { failureRedirect: '/login?error=Invalid%20username%20or%20password' }),
  (req, res) => {
    res.redirect('/contact');
  }
);

// Register route
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'register.html'));
});

router.post('/register', async (req, res) => {
  const { username, name, gender, DOB, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      const newUser = new User({ username, name, gender, DOB, password });
      await newUser.save();

      // Add yourself to Friends 
      const user = await User.findOne({username:username});
      user.friends.push(user._id);
      await user.save();

      req.login(newUser, (err) => {
        if (err) {
          console.error('Error:', err);
          return res.redirect(`/register?error=${encodeURIComponent('Something went wrong. Please try again.')}`);
        }
        return res.redirect('/contact');
      });
    } else {
      return res.redirect(`/register?error=${encodeURIComponent('Username is already taken.')}`);
    }
  } catch (err) {
    console.error(err);
    return res.redirect(`/register?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`);
  }
});

//Handling user logout------------------------------------------------------------------------------

router.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect('/');
    });
});

module.exports = router;