module.exports = {
    convertCoin: function (coincode, type_market){
        var marketcoincode = "";
        if (type_market === 'BTC'){
            marketcoincode = "BTC-" + coincode;        
            if (coincode === 'BTC'){
                marketcoincode = 'USDT-BTC';
            }
        }
        if (type_market === 'USDT'){
            marketcoincode = "USDT-" + coincode;        
            if (coincode === 'BTC'){
                marketcoincode = 'USDT-BTC';
            }
        }
        return marketcoincode;
    },
    getInfo: function (senderId, data_api){
        var message = "✅ Hi " + data_api.Name + "\n";
        message += "Số ID: " + senderId + "\n";
        if (typeof data_api.Phone === 'undefined'){
            message += "Phone: Updating \n";
        }
        else{   
            message += "Phone: " + data_api.Phone + "\n";
        }
        if (typeof data_api.Email === 'undefined'){
            message += "Email: Updating \n";
        }
        else{
            message += "Email: " + data_api.Email + "\n";
        }
        var strApiKey = data_api.ApiKey;
        message += "ApiKey: " + strApiKey.substr(0,4) + " ................ " + strApiKey.substr(-4) + "\n";
        message += "Vốn đầu tư: " + data_api.Wallet + " USDT \n";
        if (typeof data_api.Maxtrade === 'undefined'){
            message += "Số crypto tối đa được giao dịch: Updating \n";
        }
        else{
            message += "Số crypto tối đa được giao dịch: " + data_api.Maxtrade + "\n";
        }
        if (data_api.Active === true){
            message += "Trạng thái: Hoạt động bình thường";
        }
        else{
            message += "Trạng thái: Bị khóa" ;
        }
        return message;
    }
};