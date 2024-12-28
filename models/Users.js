const mongoose = require('mongoose');

const userSchema={
    username:String,
    name:String,
    gender:String,
    password:String,
    profilePicture: {
        type: Buffer, // Store binary data
    },
    friends: [{}],
    friendRequests: [{}]
};

module.exports = mongoose.model("User",userSchema);
