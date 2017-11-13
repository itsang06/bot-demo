//const express = require("express");
//const app = express();
'use strict'
const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController
const TextCommand = Telegram.TextCommand
const tg = new Telegram.Telegram('456562643:AAGF_5ChgmOJldltkRSjtrjlpATfGSI3GAI')
const services = require('./services.js')

var quere = [];
var amout_quere = [];
//var amout_quere;
var vol_quere = [];
var curVol = [];
var store = [];
var buyInterval = [];
var sellInterval = [];

function actionBuy(amout,i){
	amout_quere[i] = amout_quere[i] - amout;
	if(amout_quere[i] < 0.5){
		clearInterval(buyInterval[i]);
		quere.splice(i,1);
    }
}

// function actionSell(amout,i){
// 	vol_quere[i] = vol_quere[i] - amout;
// 	if(vol_quere[i] < 0.5){
// 		clearInterval(sellInterval[i]);
// 		quere.splice(i,1);
// 	}
// }

// class PingController extends TelegramBaseController {
//     /**
//      * @param {Scope} $
//      */
//     pingHandler($) {
//         $.sendMessage('pong')
//     }

//     get routes() {
//         return {
//             'pingCommand': 'pingHandler'
//         }
//     }
// }
class BuyController extends TelegramBaseController {
        /**
         * @param {Scope} $
         */
        
        buyHandler($) {
            //console.log(amout_quere[i]); 
            //sellInterval[0] = setInterval(buyHandler(), 2000)
            //buy($)

            let arr = $.message.text.split(' ')
            var type_BTC = "BTC-" + arr[1]
            var bid = arr[2]
            var i = 0
            var amout_q = arr[3]

            buyInterval[0] = setInterval(function(){buy($, type_BTC, bid, i, amout_q)}, 2000)
        }
        
        get routes() {
            return {
                'buyCommand': 'buyHandler'
            }
        }
    }

    function buy($, type_BTC, bid, i, amout_q){
        // let arr = $.message.text.split(' ')
        // var type_BTC = "BTC-" + arr[1]
        // var bid = arr[2]
        // var i = 0
        
        amout_quere[i] = amout_q
        
        //console.log(amout_quere[i])
        if(amout_quere[i] > 0.5){                
            services.getticker( { market : "USDT-BTC" }, function( data, err ){
                var curBtc = data.result.Last;
                var bitBtc = bid/curBtc;
                services.getorderbook({ market : type_BTC, depth : 0, type : 'sell' }, function( data, err ) {
                var result = data.result;
                console.log(curBtc)
                console.log(bitBtc)                    
                ///////////
                for(var j = 0 ; j < result.length; j++){
                    //console.log(result[j].Rate)
                    if(result[j].Rate <= bitBtc){                            
                        var amoutSpend = result[j].Quantity * result[j].Rate * curBtc;
                        console.log(amoutSpend);
                        if(amoutSpend > amout_quere[i]){
                            var message = "Da mua " + type_BTC + " Gia: "+ result[j].Rate+" Vol: "+ (amout_quere[i]/(result[j].Rate * curBtc));
                                message = message + "\n So tien con lai trong quere " + i + " : 0 USD";
                                //io.sockets.emit('message',{message : message});
                                $.sendMessage(message)
                                actionBuy(amout_quere[i],i);
                        } else {
                            var message = "Da mua " + type_BTC + " Gia: "+ result[j].Rate+" Vol: "+ result[j].Quantity;
                            message = message + "\n So tien con lai trong quere " + i + " : "+ (amout_quere[i] - amoutSpend) + " USD";
                            $.sendMessage(message)
                            //io.sockets.emit('message',{message : message});
                            actionBuy(amoutSpend,i);			  			
                        }                            
                        break;
                    }
                }
                });		
            });			
        } else {
            if (typeof buyInterval[i] !== 'undefined') {
                clearInterval(buyInterval[i]);
            }
            
        }
    }
    // function handle_teleg(req, res) {
    //     var msg = req.param('msg');
    //     console.log('Send to Telegram: ' + msg);
    //     //var tg = require('telegram-node-bot')('telegram-token')
    //     var date = new Date();
    //     var currentTime = new Date().toString();
    //     tg.sendMessage(your_id, msg);
    //     res.end('ok');
    // }


    // function handle(message,i){        
    //     var arr = message.split(" ");
    //     if(arr.length == 4){
    //         var action = arr[0];
    //         var type_BTC = "BTC-"+arr[1];
    //         var bid = arr[2];        
    //         var now = new Date();
    //         var date_str = now.getHours() + ":" +now.getMinutes() + ":" +now.getSeconds();
    //         var btcCurrent = 0;
    //         if(action.indexOf("buy") > -1){
    //             var amoutUsd = arr[3];
    //             amout_quere[i] = amoutUsd;			
    //             buyInterval[i] = setInterval(function(){BuyController()}, 2000);
    //         }        
    //         store[i] = 2000;
    //         if(action.indexOf("sell") > -1){
    //             var vol = arr[3];
    //             curVol[i] = vol;
    //             vol_quere[i] = curVol[i];
    //             store[i] = store[i] - vol;                                
    //             sellInterval[i] = setInterval(function(){sell(type_BTC, bid,i)}, 2000);
    //         }	
    //     } else {
    //         $.sendMessage('Sai cu phap')
    //     }
    // }

class SellController extends TelegramBaseController {
        /**
         * @param {Scope} $
         */
        sellHandler($) {
            Services.getorderbook({ market : 'BTC-PAY', depth : 0, type : 'sell' }, function(data, err) {
                if (err) {
                    return $.sendMessage(error(err))
                  }
                //var result = data.result
                ///////////
                // for(j = 0 ; j < result.length; j++){
                //     if(result[j].Rate <= bitBtc){
                        
                //         var amoutSpend = result[j].Quantity * result[j].Rate * curBtc;
                //         console.log(amoutSpend);
                //         if(amoutSpend > amout_quere[i]){
                //             var message = "Da mua " + type_BTC + " Gia: "+ result[j].Rate+" Vol: "+ (amout_quere[i]/(result[j].Rate * curBtc));
                //                 message = message + "<br/> So tien con lai trong quere " + i + " : 0 USD";
                //                 io.sockets.emit('message',{message : message});
                //                 actionBuy(amout_quere[i],i);
                //         } else {
                //             var message = "Da mua " + type_BTC + " Gia: "+ result[j].Rate+" Vol: "+ result[j].Quantity;
                //             message = message + "<br/> So tien con lai trong quere " + i + " : "+ (amout_quere[i] - amoutSpend) + " USD";
                //             io.sockets.emit('message',{message : message});
                //             actionBuy(amoutSpend,i);			  			
                //         }
                        
                //         break;
                //     }
                // }
                for( var i in data.result ) {
                    var amount = data.result[i].Rate
                    $.sendMessage(amount)
                  }
              });	

            //$.sendMessage(ticker)
        }
    
        get routes() {
            return {
                'sellCommand': 'sellHandler'
            }
        }
    }

//let timer = setInterval($.sellCommand)

tg.router
    //.when(new TextCommand('ping', 'pingCommand'), new PingController())
    .when(new TextCommand('/buy', 'buyCommand'), new BuyController())
    .when(new TextCommand('/sell', 'sellCommand'), new SellController())