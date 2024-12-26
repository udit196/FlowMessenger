const mongoose = require('mongoose');

const userSchema={
    username:String,
    name:String,
    password:String,
    profilePicture: {
        type: Buffer, // Store binary data
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
};

module.exports = mongoose.model("User",userSchema);
