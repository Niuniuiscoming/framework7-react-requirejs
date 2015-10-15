define(function() {

    /**
     * 调用原生activity插件                [description]
     */
    function startActivity(activityClassName,jsonData,successCallback) {
        if (window.cordova && window.cordova.plugins.activity) {
            window.cordova.plugins.activity.start(activityClassName,jsonData,successCallback);
        } else {
            console.log("未找到activity插件");
        }
    }

    /**
     * 蓝牙操作
     */
    function stringToBytes(string) { // ASCII only
       var array = new Uint8Array(string.length);
       for (var i = 0, l = string.length; i < l; i++) {
           array[i] = string.charCodeAt(i);
        }
        return array.buffer;
    }
    function bytesToString(buffer) { // ASCII only
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }
    function commandToBytes(command) {
        var arr = command.split(" ");
        var buffer = new ArrayBuffer(arr.length);
        var data = new Uint8Array(buffer);
        for (var i in arr) {
            data[i] = parseInt(arr[i], 16);
        };
        return data.buffer;
    }
    function bytesToCommand(buffer) {
        var data = new Uint8Array(buffer);
        var hexArr = [];
        for (var i in data) {
            var hex = data[i].toString(16);
            hex = "00".substr(0, 2 - hex.length) + hex; 
            hexArr.push(hex.toUpperCase());
        };
        return hexArr.join(" ");
    }
    function bleStartScan(services, success, error) {
        if (window.ble) {
            window.ble.isEnabled(function() {
                window.ble.startScan(services, success, error);
            },function() {
                alert("请打开蓝牙");
            });
        } else {
            alert("系统异常，未找到ble插件");
        }
    }
    function bleStopScan(success, error) {
        window.ble.stopScan(success, error);
    }
    function bleConnect(device_id, success, error) {
        window.ble.connect(device_id, success, error);
        // success中返回peripheral对象，类似下列结构
        // {
        //     "characteristics": [{
        //         "descriptors": [{
        //             "uuid": "2902"
        //         }, {
        //             "uuid": "2901"
        //         }],
        //         "characteristic": "ffe1",
        //         "service": "ffe0",
        //         "properties": ["Read", "WriteWithoutResponse", "Notify"]
        //     }],
        //     "advertising": {},
        //     "id": "20:C3:8F:FD:6D:76",
        //     "services": ["ffe0"],
        //     "rssi": -46,
        //     "name": "LANYA"
        // }
    }
    function bleDisconnect(device_id, success, error) {
        window.ble.disconnect(device_id, success, error);
    }
    function bleWrite(peripheral, data, success, error) {
        var characteristic = getCharacteristicByHC08(peripheral.characteristics);
        if (characteristic) {
            window.ble.writeWithoutResponse(peripheral.id, characteristic.service, characteristic.characteristic, commandToBytes(data), success, error);
        } else {
            alert("该蓝牙模块不是HC-08模块，无法读写");
            error();
        }
    }
    function bleRead(peripheral, success, error) {
        var characteristic = getCharacteristicByHC08(peripheral.characteristics);
        if (characteristic) {
            window.ble.read(peripheral.id, characteristic.service, characteristic.characteristic, function(buffer){
                success(bytesToCommand(buffer));
            }, error);
        } else {
            alert("该蓝牙模块不是HC-08模块，无法读写");
            error();
        }
    }
    function bleStartNotify(peripheral, success, error) {
        var characteristic = getCharacteristicByHC08(peripheral.characteristics);
        if (characteristic) {
            window.ble.startNotification(peripheral.id, characteristic.service, characteristic.characteristic, function(buffer){
                success(bytesToCommand(buffer));
            }, error);
        } else {
            alert("该蓝牙模块不是HC-08模块，无法读写");
            error();
        }
    }
    function bleStopNotify(peripheral, success, error) {
        var characteristic = getCharacteristicByHC08(peripheral.characteristics);
        if (characteristic) {
            window.ble.stopNotification(peripheral.id, characteristic.service, characteristic.characteristic, success, error);
        } else {
            alert("该蓝牙模块不是HC-08模块，无法读写");
            error();
        }
    }
    function getCharacteristicByHC08(characteristics) {
        for (var i in characteristics) {
            //客户提供的HC08蓝牙模块的UUID为0000ffe1-0000-1000-8000-00805f9b34fb
            if (characteristics[i].characteristic == "ffe1") {
                return characteristics[i];
            }
        };
        return null;
    }

    return {
        startActivity: startActivity,
        ble: {
            startScan: bleStartScan,
            stopScan: bleStopScan,
            connect: bleConnect,
            disconnect: bleDisconnect,
            write: bleWrite,
            read: bleRead,
            startNotify: bleStartNotify,
            stopNotify: bleStopNotify
        }
    };
    
});