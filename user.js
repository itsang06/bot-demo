var mongoose = require('mongoose');
var schemaUser = new mongoose.Schema({
    ID: { type: String, required: true },
    ApiKey: { type: String, required: false },
    ApiSecret: { type: String, require: false },
    Wallet: { type: Number, require: false },
    RegDate: { type: Date, required: false, default: Date.now },
    Active: { type: Boolean, required: false, default: true }
});
module.exports = schemaUser;