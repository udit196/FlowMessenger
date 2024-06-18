const mongoose = require('mongoose');

const userSchema={
    username:String,
    name:String,
    password:String
};

module.exports = mongoose.model("User",userSchema);
