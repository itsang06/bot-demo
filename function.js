module.exports = {
    convertCoin: function (coincode){
        var marketcoincode = "BTC-" + coincode;        
        if (coincode === 'BTC'){
            marketcoincode = 'USDT-BTC';
        }
        return marketcoincode.toUpperCase();
    }
};