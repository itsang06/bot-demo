//var config = require('./config.js');
var bittrex = require('node-bittrex-api');

var mongoose = require('mongoose');
var schemaUser = require('./user');
var API_KEY = "";
var API_SECRET = "";
var url = 'mongodb://localhost/telebot';
mongoose.connect(url, {useMongoClient: true});
var db = mongoose.connection;
db.on('error', console.error);

db.once('open', function () {
    var userColl = mongoose.model('userColl', schemaUser, 'User');    
    userColl.findOne({ ID: '123123' }, function(err, data) {
        if (err) return console.error(err);
        //console.log(data.ID);
        API_KEY = data.ApiKey;
        API_SECRET = data.ApiSecret;
    });
});

bittrex.options({
  'apikey' : API_KEY,
  'apisecret' : API_SECRET
});
module.exports = bittrex;