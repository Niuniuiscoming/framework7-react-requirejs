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
     * 蓝牙扫描
     */
    function bleCheck() {
        if (window.ble) {
            window.ble.isEnabled(function() {
                console.log("Bluetooth is enabled");
            },function() {
                alert("请打开蓝牙");
            });
        } else {
            alert("未找到ble插件");
        }
    }
    function bleOnError(errorMessage) {
        alert("ERROR: " + errorMessage);
    }
    function bleStartScan(services, success) {
        bleCheck();
        window.ble.startScan(services, success, bleOnError);
    }
    function bleStopScan(success) {
        bleCheck();
        window.ble.stopScan(success, bleOnError);
    }
    function bleConnect(device_id, success) {
        bleCheck();
        window.ble.connect(device_id, success, bleOnError);
        // success中返回peripheral对象，类似下列结构
        // {
        //     "characteristics": [{
        //         "descriptors": [{
        //             "uuid": "00002902-0000-1000-8000-00805f9b34fb"
        //         }, {
        //             "uuid": "00002901-0000-1000-8000-00805f9b34fb"
        //         }],
        //         "characteristic": "0000ffe1-0000-1000-8000-00805f9b34fb",
        //         "service": "0000ffe0-0000-1000-8000-00805f9b34fb",
        //         "properties": ["Read", "WriteWithoutResponse", "Notify"]
        //     }],
        //     "advertising": {},
        //     "id": "20:C3:8F:FD:6D:76",
        //     "services": ["0000ffe0-0000-1000-8000-00805f9b34fb"],
        //     "rssi": -46,
        //     "name": "LANYA"
        // }
    }
    function bleDisconnect(device_id, success) {
        bleCheck();
        window.ble.disconnect(device_id, success, bleOnError);
    }
    function bleWrite(peripheral, data, success, error) {
        bleCheck();
        var characteristic = getCharacteristicByMode(peripheral.characteristics);
        if (characteristic) {
            window.ble.writeWithoutResponse(peripheral.id, characteristic.service, characteristic.characteristic, data, success, error);
        } else {
            alert("该蓝牙模块不是HC-08模块，无法读写");
            error();
        }
    }
    function getCharacteristicByMode(characteristics) {
        for (var i in characteristics) {
            //蓝牙4.0的UUID,其中0000ffe1-0000-1000-8000-00805f9b34fb是广州汇承信息科技有限公司08蓝牙模块的UUID
            if (characteristics[i].characteristic == "0000ffe1-0000-1000-8000-00805f9b34fb") {
                return characteristics[i];
            } 
        };
        return null;
    }

    // ASCII only
    function stringToBytes(string) {
       var array = new Uint8Array(string.length);
       for (var i = 0, l = string.length; i < l; i++) {
           array[i] = string.charCodeAt(i);
        }
        return array.buffer;
    }

    // ASCII only
    function bytesToString(buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }

    return {
        startActivity: startActivity,
        ble: {
            startScan: bleStartScan,
            stopScan: bleStopScan,
            connect: bleConnect,
            disconnect: bleDisconnect,
            write: bleWrite,
            stringToBytes: stringToBytes,
            bytesToString: bytesToString
        }
        
    };
    
});