const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user1: String,
  user2: String,
  user1_name: String,
  user2_name: String,
  messages: [
      {
          Author: String,
          message: String,
          timestamp: { type: Date, default: Date.now }
      }
  ]
});

module.exports = mongoose.model('Message', messageSchema);
