// 1. Chỉ import mongoose một lần
const mongoose = require('mongoose');

// 2. Chỉ định nghĩa UserSchema một lần
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    favoriteCities: [{ name: String, country: String }],
    date: { type: Date, default: Date.now }
});

// 3. Chỉ export model một lần
module.exports = mongoose.model('User', UserSchema);