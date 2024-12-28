const express = require('express');
const passport = require('../auth/passportConfig');
const User = require('../models/Users');
const path = require('path');
const router = express.Router();

// Friends Page------------------------------------------------------------------------------------
router.get('/friends', async (req, res) => {
    if(req.isAuthenticated()){
        res.redirect(`/friendsPage?id=${req.session.passport.user}`);
    }
    else{
        res.redirect('/login');
    }
});

router.get('/friendsPage', async (req, res) => {
    if(req.isAuthenticated()){
        res.sendFile(path.join(__dirname, '../public', 'friends.html'));
    }
    else{
        res.redirect('/login');
    }
});

router.get('/friendRequests', async (req, res) => {
    if(req.isAuthenticated()){
        const user = await User.findById(req.session.passport.user);
        const friendRequests = user.friendRequests;

        if(friendRequests){
            res.json(friendRequests);
        }else{
            res.json([]);
        }
    }
    else{
        res.redirect('/login');
    }
});

// Send Requests
router.get('/sendRequest', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const userId = req.session.passport.user;
            const friendId = req.query.id;

            if (!friendId) {
                return res.status(400).send({ message: 'Friend ID is required.' });
            }

            const user = await User.findById(userId);
            const friend = await User.findById(friendId);

            if (!user || !friend) {
                return res.status(404).send({ message: 'User or Friend not found.' });
            }

            // Check if not already a friend
            if (friend.friends.includes(userId)) {
                res.status(400).send({ message: 'Already a Friend' });

            }else if (!friend.friendRequests.includes(userId)) {
                friend.friendRequests.push(user._id);
                await friend.save();
                res.status(200).send({ message: 'Friend Request Sent.' });

            } else {
                res.status(400).send({ message: 'Friend Request already sent.' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: 'Internal Server Error.' });
        }
    } else {
        res.redirect('/login');
    }
});


// Accept Requests
router.get('/acceptRequest', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const userId = req.session.passport.user;
            const friendId = req.query.id;

            if (!friendId) {
                return res.status(400).send({ message: 'Friend ID is required.' });
            }

            const user = await User.findById(userId);
            const friend = await User.findById(friendId);

            if (!user || !friend) {
                return res.status(404).send({ message: 'User or Friend not found.' });
            }

            
            // Add to friends list
            if (!user.friends.includes(friend._id)) {
                user.friends.push(friend._id);
            }
            if (!friend.friends.includes(user._id)) {
                friend.friends.push(user._id);
            }

            // Remove from friendRequests
            user.friendRequests = user.friendRequests.filter(
                (request) => request.toString() !== friendId
            );

            await user.save();
            await friend.save();

            res.status(200).send({ message: 'Friend Request Accepted.' });
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: 'Internal Server Error.' });
        }
    } else {
        res.redirect('/login');
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).send({ message: 'User not found.' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error.' });
    }
});

//Get All Friends----------------------------------------------------------------------------------
router.get('/users', async (req, res) =>{
    if(req.isAuthenticated()){
        const users = await User.find().sort({ name: 'asc' });
        res.json(users);
    }
    else{
        res.redirect('/login');
    }
});

module.exports = router;