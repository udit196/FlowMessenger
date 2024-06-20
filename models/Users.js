const mongoose = require('mongoose');

const userSchema={
    username:String,
    name:String,
    password:String,
    dp: {
        data: Buffer,
        contentType: String
      }
};

module.exports = mongoose.model("User",userSchema);
