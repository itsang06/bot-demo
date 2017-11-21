//require('events').EventEmitter.defaultMaxListeners = 100;
var services = require('node-bittrex-api');
const TelegramBot = require('node-telegram-bot-api');
const token = require('./config');
const func = require('./function');
const bot = new TelegramBot(token.key, {polling: true});
//var services = require('./services.js');
var mongoose = require('mongoose');
var schemaUser = require('./user');
var url = 'mongodb://localhost/telebot';
////////////////////////
var quere = [];
var quere_status = [];
//var curVol = [];
//var bsInterval = [];
//////Khai bao////////
var sell_Store = [];
var buy_Store = [];
var sell_Store_Status = [];
var buy_Store_Status = [];
var buy_Store_Vol = [];
var sellInterval = [];
var buyInterval = [];
var balance_Store = [];

var amout_quere = [];
var vol_quere = [];
/////////////////////
const msgStart = `💡 Cấu trúc lệnh thực thi
   Cú pháp : #buy,LTC,0.0015,0.5
		----LTC loại coin muốn chạy
		----0.0015 tức là 0.0015 tính theo giá ask BTC
		----0.5 tức là 0.5 BTC
		----Nếu muốn mua ngay dùng lệnh #buy,LTC,0,0.5
   Cú pháp : #sell,LTC,0.0018,800
		----LTC loại coin muốn chạy
		----0.0018 tức là 0.0018 tính theo giá bid BTC
		----800 tức là khối lượng coin LTC muốn bán
		----Nếu muốn bán ngay dùng lệnh #sell,LTC,0,0.5
		----Nếu muốn bán tất cả khối lượng thì dùng lệnh #sell,LTC,0.0018,*

  #del,DGB | Xóa tất cả các lệnh đang chờ của DGB 
  #del* | Xóa tất cả các lệnh, reset

  #pause,buy | Tạm dừng giao dịch các lệnh Mua
  #pause,sell | Tạm dừng giao dịch các lệnh Bán
 
  #restart,buy | Tiếp tục giao dịch các lệnh Mua
  #restart,sell | Tiếp tục giao dịch các lệnh Bán

Cấu trúc lệnh hỏi thông tin
   ?Order* | Xem danh sách tất cả các lênh hiện có
   ?Balance* | Báo cáo chi tiết số dư các Crypto
   ?Check,LTC | Xem giá coin
   ?Info | Thông tin tài khoản

Cấu trúc lệnh thay đổi thông tin
   #apikey,Key,Secrect | Cập nhật apikey và secret

Cấu trúc câu lệnh khác:
   /help | Giúp đỡ
   /dangky,Key,Secrect | Đăng ký tài khoản mới apikey và secret
   /button | Hiện nút lệnh cơ bản
`

function actionBuy(amout, i, marketcoincode, chatId){
	amout_quere[i] = amout_quere[i] - parseFloat(amout);	
	if(amout_quere[i] <= 0){
		clearInterval(buyInterval[i]);
		buy_Store_Status.splice(i, 1, -1);
		updateBalanceStore(i, marketcoincode, chatId);
	}
}
function actionSell(amout, i, marketcoincode, chatId){
	vol_quere[i] = vol_quere[i] - amout;
	if(vol_quere[i] <= 0){
		clearInterval(sellInterval[i]);
		sell_Store_Status.splice(i, 1, -1);
	}
}
function updateBalanceStore(i, marketcoincode, chatId){
	//id,#buy,LTC,ask,amout	
	var buy_Store_get_item = buy_Store[i];
	if (typeof buy_Store_get_item !== 'undefined'){
		var arr = buy_Store_get_item.split(",");
		var amout_quere_tmp = parseFloat(arr[4]);
		var vol_balance_update;
		var vol_available_update;
		var coincode = arr[2];
		var balance_Store_item = [];
		var item = 0;
		for(j = 0; j < balance_Store.length; j++){			
			var arr_balance =  balance_Store[j].split(",");
			if (arr_balance[0].toString() === chatId.toString() && arr_balance [1] === coincode){
				balance_Store_item = arr_balance;
				item = j;
				break;
			}
		}
		if (balance_Store_item.length > 0){
			vol_balance_update = parseFloat(balance_Store_item[3]);
			vol_balance_update = vol_balance_update + buy_Store_Vol[i];
			vol_available_update = parseFloat(balance_Store_item[4]);				
			vol_available_update = vol_available_update + buy_Store_Vol[i];	
			//balance_Store item: id,coincode,marketcoincode,balance,available		
			var balance_store_txt = chatId + "," + coincode + "," + marketcoincode + "," + vol_balance_update + "," + vol_available_update;	
			balance_Store.splice(item, 1, balance_store_txt);							
			console.log('BUY ' + amout_quere_tmp + " BTC coin: " + coincode + ' xong và cập nhật vào Store với Vol : ' + buy_Store_Vol[i]);			
			console.log("Balance 1 hiện tại của " + coincode + ": " + balance_Store[balance_Store.length-1]);
		}
		else{
			checkConnect(chatId, function(data_api){
				APICALL(data_api.ApiKey, data_api.ApiSecret);
				services.getbalance({currency : coincode},function(databalance,err){
					if (databalance != null){
						var result = databalance.result
						var vol_balance = 0;
						if (result.Balance != null){
							vol_balance = result.Balance;
						}
						var vol_available = 0;
						if (result.Available != null){
							vol_available = result.Available;
						}					
						vol_balance = vol_balance + buy_Store_Vol[i];
						vol_available = vol_available + buy_Store_Vol[i];
						var balance_store_txt = chatId + "," + coincode + "," + marketcoincode + "," + vol_balance + "," + vol_available;							
						balance_Store.push(balance_store_txt);
						console.log('BUY ' + amout_quere_tmp + " BTC coin: " + coincode + ' xong và cập nhật vào Store với Vol : ' + buy_Store_Vol[i]);						
						console.log("Balance 2 hiện tại của " + coincode + ": " + balance_Store[balance_Store.length-1]);
					}
					else{
						bot.sendMessage(chatId, "Lỗi kết nối !");						
					}
				});
			});
		}		
	}
}
function buy(coincode, marketcoincode, ask, i, chatId){
	services.getorderbook({ market : marketcoincode, depth : 0, type : 'sell' }, function( data, err ) {					
		if(data != null){
			var result = data.result;
			if (ask === '0')
				ask = result[0].Rate;
			for(j = 0 ; j < result.length; j++){
				if(result[j].Rate <= ask){								
					var amoutSpend = result[j].Quantity * result[j].Rate;
					if(amoutSpend > amout_quere[i]){
						var message = "Đã mua " + marketcoincode + " Gia: "+ result[j].Rate + " Vol: "+ (amout_quere[i]/result[j].Rate).toFixed(8);
							message = message + "\n BUY trong quere " + i + " còn lại : 0 BTC";
							buy_Store_Vol[i] += buy_Store_Vol[i] + (amout_quere[i]/result[j].Rate);
							bot.sendMessage(chatId, message);							
							actionBuy(amout_quere[i], i, marketcoincode, chatId);
					} else {
						var message = "Da mua " + marketcoincode + " Gia: "+ result[j].Rate + " Vol: " + result[j].Quantity;
						message = message + "\n BUY trong quere " + i + " còn lại : " + (amout_quere[i] - amoutSpend).toFixed(8) + " BTC";
						buy_Store_Vol[i] += buy_Store_Vol[i] + amoutSpend;
						bot.sendMessage(chatId, message);
						actionBuy(amoutSpend, i, marketcoincode, chatId);			  			
					}
					break;
				}
			}
		} else {
			bot.sendMessage(chatId, "Sai market code");
			if (typeof buyInterval[i] !== 'undefined'){
				clearInterval(buyInterval[i]);
				buy_Store_Status.splice(i, 1, -1);			
			}						
		}
	});
	console.log(chatId + " BUY running quere " + i + " - Cần mua thêm: " + amout_quere[i]);
}

function sell(coincode, marketcoincode, bid, i, chatId){			
	services.getorderbook({ market : marketcoincode, depth : 0, type : 'buy' }, function( dataorderbook, err ) {
		if(dataorderbook != null){
			var result = dataorderbook.result;
			for(j = 0 ; j < result.length; j++){
				if(result[j].Rate >= bid){				  		
					var volSold = result[j].Quantity;									
					if(volSold >= vol_quere[i]){				  			
						var message = "Da ban: " + (parseFloat(vol_quere[i])).toFixed(8) + " " + coincode + " Rate: " + result[j].Rate;
						message += "\n SELL trong hàng đợi " + i + " còn lại: "+ "0";				  		
						bot.sendMessage(chatId,message);
						actionSell(vol_quere[i], i, marketcoincode, chatId);
					} else {
						var message = "Đã bán: " + volSold.toFixed(8) + " " + coincode + " Rate: " + result[j].Rate;
						message += "\n SELL trong hàng đợi " + i + " Còn lại: " + (vol_quere[i] - volSold).toFixed(8);				  		
						bot.sendMessage(chatId,message);
						actionSell(volSold, i, marketcoincode, chatId);
					}
					break;
				}				
			}
		} else {
			console.log("Lenh sell getorderbook bi loi.");
			if (typeof sellInterval[i] !== 'undefined'){
				clearInterval(sellInterval[i]);
				sell_Store_Status.splice(i, 1, -1);
			}
		}
	});
	console.log(chatId + " SELL running quere " + i + " - Vol con lai: " + vol_quere[i]);
}

function getCurrentBtc(){
	var curBtc = 0;
	services.getticker( { market : "USDT-BTC" }, function( data, err ){
		curBtc = data.result.Last;
	});
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
	  //console.log(data);
      var mang_Balance = {};
      var message_chinh = "======================\n💎 All Balance Account 💎\n======================\n";
      for(dem1 = 0 ; dem1 < result.length; dem1++)
      {
        if(result[dem1].Balance > 0)
        {
          var Currency_tmp = result[dem1].Currency;
          var Balance_tmp = result[dem1].Balance;
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
            //console.log("Dư "+Currency_tmp+": "+soducoin+" | Dư BTC: "+soducoin_btc+"\n");
          }          
        }

	  }
	  if (result.length === 0)
	  {
		message_chinh += "Tài khoản chưa có coin nào.";
	  }
      //console.log(mang_Balance);
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

function checkCoin(chatId, marketcoincode){
	services.getticker( { market : marketcoincode }, function( data, err ){
		if (err) {
			bot.sendMessage(chatId, "❌ Không tồn tại mã coin này, vui lòng thử lại!");
			return console.error(err);
		}
		var message = "💲 " + marketcoincode + ":\n";
		message += "Last: " + data.result.Last + "\n";
		message += "Bid: " + data.result.Bid + "\n";
		message += "Ask: " + data.result.Ask;
		bot.sendMessage(chatId, message);
	});
}

function APICALL(API_KEY, API_SECRET)
{
	services.options({'apikey' : API_KEY,'apisecret' : API_SECRET });
}

function getBalanceByCoin(coin){

}

var checkConnect = function(chatId,callback){
	mongoose.connect(url, {useMongoClient: true});
	var db = mongoose.connection;
	db.on('error', console.error);
	var userColl = mongoose.model('userColl', schemaUser, 'User');
	db.once('open', function () {		
		userColl.findOne({ ID: chatId }, function(err, data) {			
			if (err){
				console.log("checkConnect - Lỗi kết nối với database!");
				console.error(err);
				return;
			}
			if (data === null){
				console.log("checkConnect - Data Null!");
				return;
			}
			if (data.length === 0){
				bot.sendMessage(chatId, 'Bạn chưa đăng ký ! \n Để đăng ký bạn dùng cú pháp lệnh như sau: \n #dangky,Key,Secrect | Đăng ký tài khoản mới apikey và secret');
			}else
			{
				callback(data);
			}
		});
	});
}

function restartHandle(type_order, i, chatId){
	//id,#buy,LTC,ask,amout
	if (type_order === 'buy'){
		if (typeof buy_Store[i] !== 'undefined'){
			var arr = buy_Store[i].split(',');
			var coincode = arr[2];
			var marketcoincode = func.convertCoin(coincode);
			var rate = arr[3];
			buyInterval[i] = setInterval(function(){buy(coincode, marketcoincode, rate, i, chatId)}, 2000);
		}
	}
	if (type_order === 'sell'){
		if (typeof sell_Store[i] !== 'undefined'){
			var arr = sell_Store[i].split(',');
			var coincode = arr[2];
			var marketcoincode = func.convertCoin(coincode);
			var rate = arr[3];
			sellInterval[i] = setInterval(function(){sell(coincode, marketcoincode, rate, i, chatId)}, 2000);
		}
	}
}

function handle(message, chatId){
	var arr = message.split(",");	
	//var chatId = arr[0];
	var action = arr[1];
	var coincode = arr[2]	
	var marketcoincode = func.convertCoin(coincode);
	var rate = arr[3];
	if(action.indexOf("#buy") > -1){
		var amout_quere_tmp = arr[4];
		if(amout_quere_tmp === '*' ){			
			services.getbalance({currency : "BTC"},function(data,err){
				var curVol = data.result.Available;
				if(curVol === null){
					curVol = 10;
				}	
				amout_quere_tmp = curVol;
			})
		}	
		var buy_Store_txt = chatId + ",#buy," + coincode + "," + rate + "," + amout_quere_tmp;
		buy_Store.push(buy_Store_txt);
		console.log('Them lenh buy vao hang doi ' + buy_Store.length + ': ' + buy_Store_txt);
		var q = buy_Store.length - 1;		
		buy_Store_Status[q] = 1;
		amout_quere[q] = amout_quere_tmp;
		buy_Store_Vol[q] = 0;
		buyInterval[q] = setInterval(function(){buy(coincode, marketcoincode, rate, q, chatId)}, 2000);
	}
	if(action.indexOf("#sell") > -1){
		//balance_Store item: id,coincode,marketcoincode,balance,available
		var vol_quere_temp = arr[4];
		var balance_Store_item = [];
		var item = 0;
		for(j = 0; j < balance_Store.length; j++){			
			var arr_balance =  balance_Store[j].split(",");
			if (arr_balance[0].toString() === chatId.toString() && arr_balance[1] === coincode){
				balance_Store_item = arr_balance;
				item = j;
				break;
			}
		}
		if (balance_Store_item.length > 0){
			var vol_available_update = parseFloat(balance_Store_item[4]);
			if (vol_available_update > 0){
				if(vol_quere_temp === '*'){
					vol_quere_temp = vol_available_update;					
					vol_available_update = 0;
				}
				else{
					if (vol_available_update < vol_quere_temp){
						vol_quere_temp = vol_available_update;
						vol_available_update = 0;
					}
					else {
						vol_available_update = vol_available_update - vol_quere_temp;
					}
				}
				var balance_store_txt_2 = chatId + "," + coincode + "," + marketcoincode + "," + balance_Store_item[3] + "," + vol_available_update;	
				balance_Store.splice(item, 1, balance_store_txt_2);
				var sell_Store_txt = chatId + ",#sell," + coincode + "," + rate + "," + vol_quere_temp;
				sell_Store.push(sell_Store_txt);				
				console.log('Them lenh sell vao hang doi ' + sell_Store.length + ': ' + sell_Store_txt);
				var q = sell_Store.length - 1;
				sell_Store_Status[q] = 1;
				vol_quere[q] = vol_quere_temp;
				sellInterval[q] = setInterval(function(){sell(coincode, marketcoincode, rate, q, chatId)}, 2000);	
			}else{
				bot.sendMessage(chatId, "Tài khoản của bạn không còn đủ số coin cần bán.");
			}
		}
		else{
			checkConnect(chatId, function(data_api){
				APICALL(data_api.ApiKey, data_api.ApiSecret);
				services.getbalance({currency : coincode},function(databalance,err){
					if (databalance != null){
						var result = databalance.result
						var vol_available = result.Available;
						if (vol_available != null){
							var vol_balance = result.Balance;
							if(vol_quere_temp === '*'){
								vol_quere_temp = vol_available;					
								vol_available = 0;
							}
							else{
								if (vol_available < vol_quere_temp){
									vol_quere_temp = vol_available;
									vol_available = 0;
								}
								else {
									vol_available = vol_available - vol_quere_temp;
								}
							}
							//id,coincode,marketcoincode,balance,available
							var balance_store_txt = chatId + "," + coincode + "," + marketcoincode + "," + vol_balance + "," + vol_available;							
							balance_Store.push(balance_store_txt);
							var sell_Store_txt = chatId + ",#sell," + coincode + "," + rate + "," + vol_quere_temp;
							sell_Store.push(sell_Store_txt);
							console.log('Them lenh sell vao hang doi ' + sell_Store.length + ': ' + sell_Store_txt);
							var q = sell_Store.length - 1;
							vol_quere[q] = vol_quere_temp;
							sell_Store_Status[q] = 1;
							sellInterval[q] = setInterval(function(){sell(coincode, marketcoincode, rate, q, chatId)}, 2000);
						}
						else{
							bot.sendMessage(chatId, "❌ Mã coin này không tồn tại trong tài khoản.");
						}
					}
					else{
						bot.sendMessage(chatId, "❌ Lỗi kết nối !");						
					}
				});
			});
		}		
		
	}
}

bot.on('message', (msg) => {
	var text = msg.text;
	var chatId = msg.chat.id;
	var arr = text.split(",");
	if(text === '/start'){		
		bot.sendMessage(chatId, msgStart, {
			"reply_markup": {
				"keyboard": [["?Balance*", "?Order*", "?Info"], ["/help"]]
				}
			});
		return;	
	}
	if (text === '/help'){
		bot.sendMessage(chatId, msgStart, {
			"reply_markup": {
				"keyboard": [["?Balance*", "?Order*", "?Info"], ["/help"]]
				}
			});
		return;	
	}
	if (text.indexOf("/dangky,") >- 1){
		//#dangky,apikey,apisecrect
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
				msgDangKy = 'Ban da dang ky thanh cong voi ID ' + ID;
			});
					
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
	if (text === '?Info' || text === '?info'){
		checkConnect(chatId, function(data_api){
			getInfo(chatId, data_api);
		});
		
		return;	
	}
	if (text.indexOf("?Check,") >- 1 || text.indexOf("?check,") >- 1){
		var arr = text.split(",");
		if (arr.length === 2){
			var marketcoincode = func.convertCoin(arr[1])
			checkCoin(chatId, marketcoincode);
		}
		else{
			bot.sendMessage(chatId,"❌ Sai cú pháp, vui lòng kiểm tra lại !");
		}
		return;	
	}
	// Danh sách lệnh
	if(text === '?Order*' || text === '?order*'){
		var messageBuy = "";
		var buy_quere_sl = 0;		
		if(buy_Store.length > 0){			
			for(i = 0 ; i < buy_Store.length; i++){
				var arr = buy_Store[i].split(",");
				if (arr[0].toString() === chatId.toString() && buy_Store_Status[i] != -1){
					let status = "Running";
					// if(buy_Store_Status[i] == -1){
					// 	status = "Deleted";
					// }
					if(buy_Store_Status[i] == 0){
						status = "Pause";
					}
					messageBuy += arr[1] + "," + arr[2] + "," + arr[3] + "," + arr[4] + ' - ' + status + "\n";
					buy_quere_sl += 1;
				}
			}
		}
		var messageSell = "";
		var sell_quere_sl = 0;
		if(sell_Store.length > 0){
			for(i = 0 ; i < sell_Store.length; i++){
				var arr = sell_Store[i].split(",");
				if (arr[0].toString() === chatId.toString()  &&  sell_Store_Status[i]  != -1){
					let status = "Running";
					// if(sell_Store_Status[i] == -1){
					// 	status = "Deleted";
					// }
					if(sell_Store_Status[i] == 0){
						status = "Pause";
					}
					messageSell += arr[1] + "," + arr[2] + "," + arr[3] + "," + arr[4] + ' - ' + status + "\n";
					sell_quere_sl += 1;
				}
			}
		}
		var message = "✅ " + msg.from.first_name + " " +  msg.from.last_name + ": " + (buy_quere_sl + sell_quere_sl) + " Orders";
		message += "\n==============================\n";
		message += messageBuy;
		message += messageSell;
		bot.sendMessage(chatId,message);
		return;		
	}	
	
	if(text.indexOf('#pause,buy') > -1){
		for(i = 0; i < buy_Store.length; i++){
			var arr =  buy_Store[i].split(",");
			//id,#buy,LTC,ask,amout
			if (arr[0].toString() === chatId.toString()){
				buy_Store_Status.splice(i, 1, 0);
				if (typeof buyInterval[i] !== 'undefined') {
					clearInterval(buyInterval[i]);	
				} 
			}						
		}
		bot.sendMessage(chatId, "Đã dừng hết các lệnh BUY trong hàng đợi !");		
		return ;
	}
	if(text === '#restart,buy'){
		for(j = 0; j < buy_Store.length; j++){
			var arr =  buy_Store[j].split(",");
			if (arr[0].toString() === chatId.toString()){
				if (amout_quere[j] > 0 && buy_Store_Status[j] === 0){					
					buy_Store_Status.splice(j, 1, 1);					
					restartHandle('buy', j, chatId);
				} 
			}						
		}
		bot.sendMessage(chatId, "Đã restart lại các lệnh BUY trong hàng đợi !");
		return ;
	}
	if(text.indexOf('#pause,sell') > -1){
		for(i = 0; i < sell_Store.length; i++){
			var arr =  sell_Store[i].split(",");
			if (arr[0].toString() === chatId.toString()){
				sell_Store_Status.splice(i, 1, 0);
				if (typeof sellInterval[i] !== 'undefined') {
					clearInterval(sellInterval[i]);	
				} 
			}						
		}
		bot.sendMessage(chatId, "Đã dừng hết các lệnh SELL trong hàng đợi !");
		return ;
	}
	if(text === '#restart,sell'){
		for(j = 0; j < sell_Store.length; j++){
			var arr =  sell_Store[j].split(",");
			//id,#buy,LTC,ask,amout
			if (arr[0].toString() === chatId.toString()){
				if (vol_quere[j] > 0 && sell_Store_Status[j] === 0){
					sell_Store.splice(j, 1, 1);
					restartHandle('sell', j, chatId);
				}
			}						
		}
		bot.sendMessage(chatId, "Đã restart lại các lệnh SELL trong hàng đợi !");
		return ;
	}
	if(text.indexOf('#buy') > -1){		
		if(arr.length == 4){
			//id,#buy,LTC,ask,amout
			var txtCommand = chatId + "," + text;
			handle(txtCommand, chatId);
		}
		else{
			bot.sendMessage(chatId, "❌ Sai cú pháp lệnh buy, vui lòng thử lại.");
		}		
		return;
	}
	if(text.indexOf('#sell') > -1){
		if(arr.length == 4){
			//id,#sell,LTC,bid,vol
			var txtCommand = chatId + "," + text;
			handle(txtCommand, chatId);
		}
		else{
			bot.sendMessage(chatId, "❌ Sai cú pháp lệnh sell, vui lòng thử lại.");
		}
		return;
	}
	// Action reset all
	if(text === '#del*'){
		for(i = 0; i < buy_Store.length; i++){
			var arr =  buy_Store[i].split(",");
			//id,#buy,LTC,ask,amout
			if (arr[0].toString() === chatId.toString()){
				buy_Store_Status.splice(i, 1, -1);
				if (typeof buyInterval[i] !== 'undefined') {
					clearInterval(buyInterval[i]);	
				} 
			}						
		}
		for(i = 0; i < sell_Store.length; i++){
			var arr =  sell_Store[i].split(",");
			if (arr[0].toString() === chatId.toString()){
				sell_Store_Status.splice(i, 1, -1);
				if (typeof sellInterval[i] !== 'undefined') {
					clearInterval(sellInterval[i]);	
				} 
			}						
		}
		bot.sendMessage(chatId, "Đã xóa hết các lệnh chờ trong hàng đợi !");
		return;
	}
	//Del theo mã coin
	if(text.indexOf('#del,') > -1) {
		var arr = text.split(",");
		if (arr.length === 2){		
			var type_coin = arr[1];
			for(i = 0; i < buy_Store.length; i++){
				var arr =  buy_Store[i].split(",");
				//id,#buy,LTC,ask,amout
				if (arr[0].toString() === chatId.toString() && arr[2] === type_coin){
					buy_Store_Status.splice(i, 1, -1);
					if (typeof buyInterval[i] !== 'undefined') {
						clearInterval(buyInterval[i]);	
					} 
				}						
			}
			for(i = 0; i < sell_Store.length; i++){
				var arr =  sell_Store[i].split(",");
				if (arr[0].toString() === chatId.toString() && arr[2] === type_coin){
					sell_Store_Status.splice(i, 1, -1);
					if (typeof sellInterval[i] !== 'undefined') {
						clearInterval(sellInterval[i]);	
					} 
				}						
			}
			bot.sendMessage(chatId, "Đã xóa hết các lệnh chờ trong hàng đợi của coin " + type_coin);
		}else{
			bot.sendMessage(chatId, "❌ Sai cú pháp lệnh del, vui lòng thử lại.");
		}
		return;		
	}
	if(text.indexOf('/button') > -1){		
		bot.sendMessage(chatId, "Phím lệnh cơ bản của " + msg.from.first_name + " " +  msg.from.last_name, {
			"reply_markup": {
				"keyboard": [["?Balance*", "?Order*", "?Info"], ["/help"]]
				}
			});
		bot.sendInlineKeyboard
		return;
	}	
	bot.sendMessage(chatId,"❌ Sai cú pháp, vui lòng kiểm tra lại !");	 		
  });