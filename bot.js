var services = require('node-bittrex-api');
const TelegramBot = require('node-telegram-bot-api');
//var services = require('./services.js');
var mongoose = require('mongoose');
var schemaUser = require('./user');
var url = 'mongodb://localhost/telebot';


var quere = [];
var quere_status = [];
var amout_quere = [];
var vol_quere = [];
var curVol = [];
var store = [];
// var buyInterval = [];
// var sellInterval = [];
var bsInterval = [];

//Token bot telegram
const token = 'xxx';
const bot = new TelegramBot(token, {polling: true});

const msgStart = `💡 Cấu trúc lệnh thực thi
Cú pháp : #buy,LTC,0.15,1000
		----LTC loại coin muốn chạy
		----0.15 tức là 0.15$ tính theo giá ask USDT
		----1000 tức là 1000$ tính theo giá USDT
Cú pháp : #sell,LTC,0.18,800
		----LTC loại coin muốn chạy
		----0.18 tức là 0.18$ tính theo giá bid USDT
		----1000 tức là khối lượng coin LTC muốn bán
---------------------------
#del,DGB | Xóa tất cả các lệnh đang chờ của DGB 
#del* | Xóa tất cả các lệnh, reset
---------------------------
❔ Cấu trúc lệnh hỏi thông tin
?Order* | Xem danh sách tất cả các lênh hiện có
?Balance* | Báo cáo chi tiết số dư các Crypto
?Check,LTC | Xem giá coin
?Info | Thông tin tài khoản
---------------------------
👨 Cấu trúc lệnh thay đổi thông tin
#apikey,Key,Secrect | Cập nhật apikey và secret
`


function actionBuy(amout,i){
	amout_quere[i] = amout_quere[i] - amout;
	if(amout_quere[i] < 0.5){
		clearInterval(bsInterval[i]);
		//quere.splice(i,1);
		quere_status.splice(i,1,-1);
	}
	console.log('SL interval con lai ' + bsInterval.length);
}

function actionSell(amout,i){
	vol_quere[i] = vol_quere[i] - amout;
	if(vol_quere[i] < 0.5){
		clearInterval(bsInterval[i]);
		//quere.splice(i,1);
		quere_status.splice(i,1,-1);
	}
}

function buy(type_BTC,bid,i,senderId){
	console.log('Vao lenh buy ' + type_BTC)
	// checkConnect(senderId, function(data_api){
	// 	APICALL(data_api.ApiKey, data_api.ApiSecret);
	// });
	if(quere_status[i] == 1){
		if(amout_quere[i] === -1000 ){
			
			services.getbalance({currency : "BTC"},function(data,err){
				var curVol = data.result.Available;
				if(curVol === null){
					curVol = 10;
				}			
				services.getticker( { market : "USDT-BTC" }, function( data, err ){
					curBtc = data.result.Last;
					amout_quere[i] = curVol * curBtc;
					bot.sendMessage(senderId,'Tong so tien dang co: '+amout_quere[i] + ' USD');
				})
			})
		} else{
		if(amout_quere[i] > 0.5){
			services.getticker( { market : "USDT-BTC" }, function( data, err ){
				curBtc = data.result.Last;
				var bitBtc = bid/curBtc;
				services.getorderbook({ market : type_BTC, depth : 0, type : 'sell' }, function( data, err ) {
					
					if(data != null){
						var result = data.result;
						///////////
						for(j = 0 ; j < result.length; j++){
							if(result[j].Rate <= bitBtc){
								
								var amoutSpend = result[j].Quantity * result[j].Rate * curBtc;
								console.log(amoutSpend);
								if(amoutSpend > amout_quere[i]){
									var message = "Da mua " + type_BTC + " Gia: "+ result[j].Rate+" Vol: "+ (amout_quere[i]/(result[j].Rate * curBtc));
										message = message + "\n So tien con lai trong quere " + i + " : 0 USD";
										bot.sendMessage(senderId,message);
										actionBuy(amout_quere[i],i);
								} else {
									var message = "Da mua " + type_BTC + " Gia: "+ result[j].Rate+" Vol: "+ result[j].Quantity;
									message = message + "\n So tien con lai trong quere " + i + " : "+ (amout_quere[i] - amoutSpend) + " USD";
									bot.sendMessage(senderId,message);
									actionBuy(amoutSpend,i);			  			
								}
								
								break;
							}
						}
					} else {
						bot.sendMessage(senderId,"Sai market code");
						if (typeof bsInterval[i] !== 'undefined'){
							clearInterval(bsInterval[i]);
							bsInterval.splice(i,1);
							quere.splice(i,1);
							quere_status.splice(i,1);			
						}						
					}

				});		
			});			
		} else {
			if (typeof bsInterval[i] !== 'undefined') {
				bot.sendMessage(senderId, "Check lai vi tri buy !!!!!!!!!!!!!!!!!!!!");
				clearInterval(bsInterval[i]);
				quere.splice(i,1);
				quere_status.splice(i,1,-1);
			}
			
		}
		}
	}
	
}

function sell(type_BTC,bidUsd,i,senderId){
	console.log('Vao lenh sell ' + type_BTC)
	// checkConnect(senderId, function(data_api){
	// 	APICALL(data_api.ApiKey, data_api.ApiSecret);
	// });
	if(quere_status[i]== 1){
		var tmp = type_BTC.replace("BTC-","");
		services.getbalance({currency : tmp},function(data,err){
			if (data != null){
				console.log(data);
				var result = data.result
				curVol[i] = result.Available;
				console.log(curVol[i]);
				if(vol_quere[i] === -1000){
					vol_quere[i] = curVol[i];
					console.log("***");
				}
			
	
			if(curVol[i] > 0){
				services.getbalance({currency : tmp},function(data,err){
					//var curVol = data.result.Available;
				
					services.getticker( { market : "USDT-BTC" }, function( data, err ){
						curBtc = data.result.Last;
						services.getorderbook({ market : type_BTC, depth : 0, type : 'buy' }, function( data, err ) {
						if(data != null){
							var result = data.result;
							for(j = 0 ; j < result.length; j++){
								if(result[j].Rate * curBtc >= bidUsd){				  		
									var amoutSpendSSS = result[j].Quantity;
									
									if(amoutSpendSSS >= vol_quere[i]){				  			
										var message4 = "Da ban: "+ vol_quere[i] +" "+ type_BTC +" Rate: "+ result[j].Rate;
										message4 += "\n Con lai: "+ "0" + " "+ type_BTC;				  		
									bot.sendMessage(senderId,message4);
										actionSell(vol_quere[i],i);
									} else {
										var message4 = "Da ban: "+ amoutSpendSSS + " " + type_BTC +" Rate: "+ result[j].Rate;
										message4 += "\n Con lai: " + (vol_quere[i] - amoutSpendSSS) + " "+ type_BTC;				  		
										bot.sendMessage(senderId,message4);
										actionSell(amoutSpendSSS,i);
									}				  		
									break;
								}
							}
						} else {
							bot.sendMessage(senderId,"Sai market code");
							if (typeof bsInterval[i] !== 'undefined') {
								clearInterval(bsInterval[i]);
								bsInterval.splice(i,1);
								quere.splice(i,1);
								quere_status.splice(i,1);
							}							
						}
						});		
					});				
				})
			} else {
				if (typeof bsInterval[i] !== 'undefined') {
					bot.sendMessage(senderId, "Check lai vi tri !!!!!!!!!!!!!!!!!!!!");
					clearInterval(bsInterval[i]);
					quere.splice(i,1);
					quere_status.splice(i,1,-1);
				}
			}
	
		}
		else{
			bot.sendMessage(senderId, "Không tồn tại mã coin " + tmp + " trong ví!");
			clearInterval(bsInterval[i]);
			bsInterval.splice(i,1);
			quere.splice(i,1);
			quere_status.splice(i,1);
		}
		})
	}
}

function getCurrentBtc(){
	var curBtc = 0;
	services.getticker( { market : "USDT-BTC" }, function( data, err ){
		curBtc = data.result.Last;
	});
}


function handle(message,i,senderId){
	var arr = message.split(",");
	if(arr.length == 5){
		var action = arr[1];
		var type_BTC = "BTC-"+arr[2];
		var bid = arr[3];
		var btcCurrent = 0;
		if(action.indexOf("#buy") > -1){
			var amoutUsd = arr[4];
			if(amoutUsd === '*' ){
				amout_quere[i] = -1000;
			} else {
				amout_quere[i] = amoutUsd;	
			}
			bsInterval[i] = setInterval(function(){buy(type_BTC, bid,i,senderId)}, 2000);
		}

		if(action.indexOf("#sell") > -1){
			var vol = arr[4];
			if(vol === "*" ){
				vol_quere[i] = -1000;
			} else {
				vol_quere[i] = vol;	
			}
			
			bsInterval[i] = setInterval(function(){sell(type_BTC, bid,i,senderId)}, 2000);
		}	
	} else {
		bot.sendMessage(senderId,"Sai cú pháp");
		quere.splice(i,1);
		quere_status.splice(i,1);
	}		

}

function getMarketFull(senderId)
{
  var message,soducoin,curCoin,phantram;

  services.getorderhistory({ market : 'BTC-EBST' }, function( data, err ) {

    //console.log(data.result);
    var kqua = data.result;
    for(i = 0; i < kqua.length; i++)
    {
      var price = kqua[i].Price;
      if(kqua[i].OrderType === "LIMIT_BUY")
      {
        soducoin = soducoin + price;

      }else if(kqua[i].OrderType === "LIMIT_SELL")
      {
        soducoin = soducoin - price;
      }
    }
    console.log("Số dư: "+soducoin);
  });

  services.getticker( { market : "BTC-EBST" }, function( data, err ){

    curCoin = data.result.Bid;

    curBalanceUSDT = curBalance * curBtc;

    message = '💎 BTC Account: \nBTC = '+curBalance+ ' \nUSD = '+curBalanceUSDT;
    
    bot.sendMessage(senderId,message);
    return;
  });
}

function getBalanceFull(senderId, data_api)
{
	
	//APICALL(data_api[0],data_api[1]);
	APICALL(data_api.ApiKey, data_api.ApiSecret);
  var message;  
  services.getbalances( function( data, err ) {
	 
    if(err)
    {
		console.log(err);
      message = "❌ Méo kiểm tra được gì hết";
      bot.sendMessage(senderId,message);
      return;      
    }else{
	  var result = data.result;
	  //console.log(result);
      var mang_Balance = {};
      var message_chinh = "======================\n💎 All Balance Account 💎\n======================\n";
      for(dem1 = 0 ; dem1 < result.length; dem1++)
      {
        //console.log(result[dem1]);
        if(result[dem1].Balance > 0)
        {
          var Currency_tmp = result[dem1].Currency;
          //console.log(Currency_tmp+"\n");
          var Balance_tmp = result[dem1].Balance;
          //Lấy số dư của coin
          if(Currency_tmp === "BTC" || Currency_tmp === "USDT")
          {  
            mang_Balance[Currency_tmp] = {'TenCoin':Currency_tmp,'Balance':Balance_tmp};
			message_chinh += Currency_tmp + " = " + Balance_tmp + "\n";
          }else{
            mang_Balance[Currency_tmp] = {'TenCoin':Currency_tmp,'Balance':Balance_tmp};           
			message_chinh += Currency_tmp + " = " + Balance_tmp + "\n";
            var soducoin;
            var soducoin_btc;
            services.getorderhistory( { market : 'BTC-'+ Currency_tmp }, function( data, err )
            {
              var kqua = data.result;              
              if(err)
              {
                console.log("kết quả lỗi");
              }else{
                //console.log(data.result);
                for(i = 0; i < kqua.length; i++)
                {
                  var coin = kqua[i].Quantity;
                  var btc_coin = kqua[i].Price;

                  if(kqua[i].OrderType === "LIMIT_BUY")
                  {
                    soducoin = soducoin + coin;
                    soducoin_btc = soducoin_btc + btc_coin;
                  }
                  if(kqua[i].OrderType === "LIMIT_SELL")
                  {
                    soducoin = soducoin - coin;
                    soducoin_btc = soducoin_btc - btc_coin;
                  }

                  mang_Balance['BTC'] += soducoin_btc;
                }
              }
            });
            console.log("Dư "+Currency_tmp+": "+soducoin+" | Dư BTC: "+soducoin_btc+"\n");
          }          
        }

      }
      console.log(mang_Balance);
      bot.sendMessage(senderId,message_chinh);
      return;
    }
  });

}

function getInfo(senderId, data_api){
	APICALL(data_api.ApiKey, data_api.ApiSecret);
	var message = "👨 Hi Client \n";
	message += "Số ID: " + senderId + "\n";
	var strApiKey = data_api.ApiKey;
	message += "ApiKey: " + strApiKey.substr(0,4) + " ................ " + strApiKey.substr(-4) + "\n";
	bot.sendMessage(senderId, message);
}

function checkCoin(senderId, data_api, coin_check){
	//APICALL(data_api.ApiKey, data_api.ApiSecret);
	services.getticker( { market : coin_check }, function( data, err ){
		var message = "💲 " + coin_check + ":\n";
		message += "Last: " + data.result.Last + "\n";
		message += "Bid: " + data.result.Bid + "\n";
		message += "Ask: " + data.result.Ask;
		bot.sendMessage(senderId, message);
	})
}

function APICALL(API_KEY, API_SECRET)
{
	services.options({
		'apikey' : API_KEY,
		'apisecret' : API_SECRET
	  });
}

var checkConnect = function(chatId,callback){
	// mongoose.connect(url, {useMongoClient: true});
	// var db = mongoose.connection;
	// db.on('error', console.error);
	// var userColl = mongoose.model('userColl', schemaUser, 'User');
	// db.once('open', function () {
	// 	console.log("Vao lenh checkConnect !");
	// 	userColl.findOne({ ID: chatId }, function(err, data) {			
	// 		if (err) return console.log("Loi roi " + err);
	// 		console.log(data.ID);
	// 		if (data.length === 0){
	// 			console.log('Ban chua dang ky !');
	// 		}else
	// 		{
	// 			callback(data);
	// 		}
	// 	});
	// });
}

bot.on('message', (msg) => {
	
	var text = msg.text;
	const chatId = msg.chat.id;
	
	if(text.indexOf("/start") > -1){		
		bot.sendMessage(chatId, msgStart);
		return;	
	}
	if (text.indexOf("/help") >- 1)
	{
		bot.sendMessage(chatId, msgStart);
		return;	
	}
	if (text.indexOf("#dangky,") >- 1)
	{
		//#dangky,apikey,apisecrect
		console.log('vao lenh dang ky');
		var arr = text.split(",");
		var msgDangKy = "";
		if (arr.length >= 3){
			var apiKey = arr[1];
			var apiSecret = arr[2];
			var ID = chatId;			

			//dang ky
			mongoose.connect(url, {useMongoClient: true});
			var db = mongoose.connection;
			db.on('error', console.error);
			var userColl = mongoose.model('userColl', schemaUser, 'User');
			db.once('open', function () {
				var userColl = mongoose.model('userColl', schemaUser, 'User');
				userColl.create({ID: ID, ApiKey: apiKey, ApiSecret: apiSecret, Wallet: 0}, {versionKey: false});
			});
			msgDangKy = 'Ban da dang ky thanh cong voi ID ' + ID;			
		}
		else{
			msgDangKy = 'Sai cu phap, vui long thu lai !'
		}
		bot.sendMessage(chatId, msgDangKy);
		return;	
	}
	//Kiểm tra balance
	if(text.indexOf('?Balance*') > -1){		
		checkConnect(chatId, function(data_api){
			getBalanceFull(chatId, data_api);
		});		
		
		return;
	}
	if (text.indexOf("?Info") >- 1)
	{
		checkConnect(chatId, function(data_api){
			getInfo(chatId, data_api);
		});
		
		return;	
	}
	if (text.indexOf("?Check") >- 1)
	{
		var arr = text.split(",");
		// checkConnect(chatId, function(data_api){
		// 	checkCoin(chatId, data_api, "BTC-" + arr[1]);
		// });
		checkCoin(chatId, "a", "BTC-" + arr[1]);
		return;	
	}
	// Action #list
	if(text.indexOf('?Order*') > -1){
			//checkConnect(chatId, function(data_api){
			//});
    		var message = "";
    		if(quere.length > 0){
				var quere_sl = 0;
    			message = 'Cac lenh trong hanh doi \n';
    			for(i = 0 ; i < quere.length; i++){
					var arr = quere[i].split(",");
					if (arr[0] == chatId && quere_status[i] != -1){
						let status = "Run";
						// if(quere_status[i] == -1){
						// 	status = "Delete";
						// }
						if(quere_status[i] == 0){
							status = "Pause";
						}
						message += arr[1] + "," + arr[2] + "," + arr[3] + "," + arr[4] + ' - ' + status + "\n";
						quere_sl += 1;
					}
				}
				if (quere_sl == 0){
					message = "Khong co lenh nao trong hang doi";
				}
    		} else {
    			message = "Khong co lenh nao trong hang doi";
    		}
    		bot.sendMessage(chatId,message);
    		return;		
	}	
	
	if(text.indexOf('#pause buy') > -1){
		console.log("Pause buy");
		for(i = 0 ; i < quere.length; i++){
			if(quere[i].indexOf('#buy') > -1){
				clearInterval(bsInterval[i]);
				quere_status[i] = 0;
			}
		}
		return ;
	}

	if(text.indexOf('#restart buy') > -1){
		console.log("Restart buy");
		for(i = 0 ; i < quere.length; i++){
			if(quere[i].indexOf('#buy') > -1){
				////////
				quere_status[i] = 1;
			}
		}
		return ;
	}

	if(text.indexOf('#pause sell') > -1){
		for(i = 0 ; i < quere.length; i++){
			if(quere[i].indexOf('#sell') > -1){
				clearInterval(bsInterval[i]);
				quere_status[i] = 0;
			}
		}
		return ;
	}

	if(text.indexOf('#buy') > -1 || text.indexOf('#sell') > -1){
		console.log('them lenh buy hoac sell vao hang doi.')
		quere_status.push(1);
		var txtCommand = chatId + "," + text;
		quere.push(txtCommand);
		console.log(txtCommand);
		handle(txtCommand,quere.length - 1, chatId);
		return;
	}

	// Action reset all
	if(text.indexOf('#del*') > -1){
		for(i = 0; i < quere.length; i++){
			if (typeof bsInterval[i] !== 'undefined') {
				clearInterval(bsInterval[i]);

			}
			if (typeof bsInterval[i] !== 'undefined') {
				clearInterval(bsInterval[i]);
			}    			
		}
		quere = [];
		quere_status = [];
		bsInterval = [];	
		bot.sendMessage(chatId,"Đã xóa hết các lệnh chờ trong hàng đợi !");
		return;
	}
	//Del theo mã coin
	if(text.indexOf('#del,') > -1) {
		console.log('vao lenh del');
		var arr = text.split(",");
		
		var type_coin = arr[1];
		console.log(type_coin);
		if (type_coin != null && quere.length > 0){
			for(i = 0 ; i < quere.length; i++){
				console.log('vao dk 1');
				if (quere[i].indexOf(type_coin) > -1){
					console.log('vao dk 2');
					
					console.log('splice ' + i)
					//console.log(bsInterval[i]);
					console.log('SL interval ' + bsInterval.length);
					clearInterval(bsInterval[i]);
					//bsInterval.splice(i,1);
					console.log('SL interval con lai ' + bsInterval.length);
					quere_status.splice(i,1,-1);
					//quere.splice(i,1);					
					console.log(quere.length);
					//clearInterval(bsInterval[i]);
					// if (typeof buyInterval[i] !== 'undefined') {
					// 	console.log('Vao clear interval ' + i)
					// 	clearInterval(buyInterval[i]);
					// }
					// if (typeof sellInterval[i] !== 'undefined') {
					// 	clearInterval(sellInterval[i]);
					// }
				}
			} 
			
		}    
		return;		
	}
	
	bot.sendMessage(chatId,"☹ Sai cú pháp, vui lòng kiểm tra lại !");
	// for(i = 0 ; i < quere.length; i++){
	// 	console.log(quere.length);
	// 	console.log(quere[i]);
	// 	handle(quere[i],i,chatId);
	// }        		
  });
