/**
 * jq打印机插件,http://www.jqsh.com,适配型号VMP02
 * 依赖插件https://github.com/don/BluetoothSerial
 * @version 1.0.0
 * @author wq@zlzkj.com
 */
define(function() {

    var config = {
        timeout: {
            connect: 30
        },
        alert: function(msg) {
            alert(msg);
        }
    };

    var setConfig = function(cfg) {
        for (var i in config) {
            if (cfg[i]) {
                config[i] = cfg[i];
            }
        }
    }

    function dataToBytes(arr) {
        var buffer = new ArrayBuffer(arr.length);
        var data = new Uint8Array(buffer);
        for (var i in arr) {
            data[i] = parseInt(arr[i], 16);
        };
        return data.buffer;
    }

    function bytesToArray(buffer) {
        var data = new Uint8Array(buffer);
        var hexArr = [];
        for (var i in data) {
            var hex = data[i].toString(16);
            hex = "00".substr(0, 2 - hex.length) + hex; 
            hexArr.push(hex.toUpperCase());
        };
        return hexArr;
    }

    //字符串转16进制Unicode数组，双字节编码
    function stringToUnicode(string) {
        string = string.toString(); //数字转字符
        var hexArr = [];
        for (var i in string) {
            var asciiDec = string.charCodeAt(i);
            var hex = asciiDec.toString(16).toUpperCase();
            if (asciiDec <= 255) {
                hexArr.push(hex);
                hexArr.push('00');
            } else {
                hexArr.push(hex.substr(2, 2));
                hexArr.push(hex.substr(0, 2));
            }
        };
        return hexArr;
    }

    var sys = {};

    sys.listPaired = function(onSuccess) {
        if (window.bluetoothSerial) {
            window.bluetoothSerial.isEnabled(function() {
                window.bluetoothSerial.list(onSuccess); //传回设备列表
            },function() {
                config.alert("请打开蓝牙");
            });
        } else {
            config.alert("系统异常，未找到bluetoothSerial插件");
        }
    }
    
    sys.discoverUnpaired = function(onSuccess) {
        if (window.bluetoothSerial) {
            window.bluetoothSerial.isEnabled(function() {
                window.bluetoothSerial.discoverUnpaired(onSuccess); //传回设备列表
            },function() {
                config.alert("请打开蓝牙");
            });
        } else {
            config.alert("系统异常，未找到bluetoothSerial插件");
        }
    }

    sys.connect = function(deviceId, onSuccess, onError) {
        var isConnected = false;
        var t = setTimeout(function(){
            if (isConnected) {
                sys.disconnect(); //确保断开
            }
            onError && onError("连接超时，" + config.timeout.connect + "秒内未连接成功");
        },1000*config.timeout.connect);

        window.bluetoothSerial.connect(deviceId, function(peripheral) {
            isConnected = true;
            clearTimeout(t);
            onSuccess && onSuccess(peripheral);
        }, function(errorMsg) {
            isConnected = false;
            clearTimeout(t);
            onError && onError(errorMsg);
        });
    }

    sys.disconnect = function(onSuccess, onError) {
        window.bluetoothSerial.disconnect(onSuccess, onError);
    }

    sys.isConnected = function(onSuccess, onFail) {
        window.bluetoothSerial.isConnected(onSuccess, onFail);
    }

    sys.write = function(data, onSuccess, onError) {
        window.bluetoothSerial.write(dataToBytes(data), onSuccess, onError);
    }

    var api = {};

    // var head = {time: '时间', temp: '温度'};
    // var data = [
    //     {time: '01-19 9:00:00', temp: 15.1},
    //     {time: '01-19 9:00:15', temp: 16.2}
    // ];
    api.printTable = function(head, data, onSuccess, onError) {
        if (data.length == 0) {
            onError && onError('表格数据不能空');
            return false;
        }

        var defaultSpaceCount = 1;
        // 每个数据字段之间空格
        var fieldSpaceCounts = [];
        //解决表头和数据对齐问题，只考虑中文表头
        for (var key in data[0]) {
            var count = data[0][key].toString().length - head[key].length*2;
            var headSpaceCount = 0;
            if (count>0) {
                headSpaceCount = count;
                fieldSpaceCounts[key] = defaultSpaceCount;
            } else {
                headSpaceCount = defaultSpaceCount;
                fieldSpaceCounts[key] = -count; //表头比数据宽，则数据后补空格
            }
            var space = '';
            for (var i=0; i<headSpaceCount; i++) {
                space += ' ';
            }
            head[key] += space;
        }
        var unicodeData = [];
        //处理表头，表头和数据分开处理，因为字段之间空白不一致
        for (var key in head) {
            unicodeData = unicodeData.concat(stringToUnicode(head[key]));
        }
        unicodeData = unicodeData.concat(['0A','00']); //换行
        //处理表格数据
        for (var i in data) {
            for (var key in data[i]) {
                unicodeData = unicodeData.concat(stringToUnicode(data[i][key]));
                for (var j=0; j<fieldSpaceCounts[key]; j++) {
                    unicodeData = unicodeData.concat(['20', '00']); //字段之间加N个空格
                }
            }
            unicodeData = unicodeData.concat(['0A','00']);
        }
        unicodeData = unicodeData.concat(['0A','00','0A','00']); //打完后再走2行
        console.log(unicodeData);
        var command = ['1C', '55', unicodeData.length, 0];
        sys.write(command.concat(unicodeData), onSuccess, onError);
    }

    return {
        setConfig: setConfig,
        config: config,
        sys: sys,
        api: api
    }

});