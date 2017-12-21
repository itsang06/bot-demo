module.exports = {
    getUserOrderList: function(arr, buy_Store, sell_Store){        
        var messageBuy = "";
        var buy_quere_sl = 0;		
        if(buy_Store.length > 0){			
            for(i = 0 ; i < buy_Store.length; i++){
                var arr_store = buy_Store[i].split(",");
                if (arr[1] === "run"){
                    if (buy_Store_Status[i] === 1){
                        let status = "Running";
                        messageBuy += arr_store[0] + "," + arr_store[1] + "," + arr_store[2] + "," + arr_store[3] + "," + (parseFloat(arr_store[4])).toFixed(8) + "," + arr_store[5] + ' - ' + status + "\n";
                        buy_quere_sl += 1;
                    }
                }
                else if (arr[1] === "pause"){
                    if (buy_Store_Status[i] === 0){
                        let status = "Pause";
                        messageBuy += arr_store[0] + "," + arr_store[1] + "," + arr_store[2] + "," + arr_store[3] + "," + (parseFloat(arr_store[4])).toFixed(8) + "," + arr_store[5] + ' - ' + status + "\n";
                        buy_quere_sl += 1;
                    }
                }
                else if (arr[1] === "del"){
                    if (buy_Store_Status[i] === -1){
                        let status = "Deleted";
                        messageBuy += arr_store[0] + "," + arr_store[1] + "," + arr_store[2] + "," + arr_store[3] + "," + (parseFloat(arr_store[4])).toFixed(8) + "," + arr_store[5] + ' - ' + status + "\n";
                        buy_quere_sl += 1;
                    }
                }
                else{
                    let status = "Running";
                    if(buy_Store_Status[i] == -1){
                        status = "Deleted";
                    }
                    if(buy_Store_Status[i] == 0){
                        status = "Pause";
                    }
                    messageBuy += arr_store[0] + "," + arr_store[1] + "," + arr_store[2] + "," + arr_store[3] + "," + (parseFloat(arr_store[4])).toFixed(8) + "," + arr_store[5] + ' - ' + status + "\n";
                        buy_quere_sl += 1;
                }
            }
        }
        var messageSell = "";
        var sell_quere_sl = 0;
        if(sell_Store.length > 0){
            for(i = 0 ; i < sell_Store.length; i++){
                var arr_store = sell_Store[i].split(",");
                if (arr[1] === "run"){
                    if (sell_Store_Status[i] === 1){
                        let status = "Running";
                        messageSell += arr_store[0] + "," + arr_store[1] + "," + arr_store[2] + "," + arr_store[3] + "," + (parseFloat(arr_store[4])).toFixed(8) + "," + arr_store[5] + ' - ' + status + "\n";
                        sell_quere_sl += 1;
                    }
                }
                else if (arr[1] === "pause"){
                    if (sell_Store_Status[i] === 0){
                        let status = "Pause";
                        messageSell += arr_store[0] + "," + arr_store[1] + "," + arr_store[2] + "," + arr_store[3] + "," + (parseFloat(arr_store[4])).toFixed(8) + "," + arr_store[5] + ' - ' + status + "\n";
                        sell_quere_sl += 1;
                    }
                }
                else if (arr[1] === "del"){
                    if (sell_Store_Status[i] === -1){
                        let status = "Deleted";
                        messageSell += arr_store[0] + "," + arr_store[1] + "," + arr_store[2] + "," + arr_store[3] + "," + (parseFloat(arr_store[4])).toFixed(8) + "," + arr_store[5] + ' - ' + status + "\n";
                        sell_quere_sl += 1;
                    }
                }
                else{
                    let status = "Running";
                    if(sell_Store_Status[i] == -1){
                        status = "Deleted";
                    }
                    if(sell_Store_Status[i] == 0){
                        status = "Pause";
                    }
                    messageSell += arr_store[0] + "," + arr_store[1] + "," + arr_store[2] + "," + arr_store[3] + "," + (parseFloat(arr_store[4])).toFixed(8) + "," + arr_store[5] + ' - ' + status + "\n";
                    sell_quere_sl += 1;
                }
            }
        }
        var message = "✅ Danh sách user order: " + (buy_quere_sl + sell_quere_sl) + " Orders";
        message += "\n==============================\n";
        message += messageBuy;
        message += messageSell;
        return message;
    }
};