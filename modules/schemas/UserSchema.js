const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  login: { type: String, required: true },
  password: { type: Object, required: true },
  socialNetwork: { type: String, required: true },
  chatId: { type: Number, required: true },
});

module.exports = userSchema;
