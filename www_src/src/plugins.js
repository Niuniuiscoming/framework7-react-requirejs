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
    function bleStartScan(services, success, failure) {
        bleCheck();
        window.ble.startScan(services, success, failure);
    }
    function bleStopScan(success, failure) {
        bleCheck();
        window.ble.stopScan(success, failure);
    }
    function bleConnect(device_id, connectSuccess, connectFailure) {
        bleCheck();
        window.ble.connect(device_id, connectSuccess, connectFailure);
    }
    function bleDisconnect(device_id, disConnectSuccess, disConnectFailure) {
        bleCheck();
		window.ble.disconnect(device_id, disConnectSuccess, disConnectFailure);
    }

	return {
		startActivity: startActivity,
		bleStartScan: bleStartScan,
		bleStopScan: bleStopScan,
        bleConnect: bleConnect,
        bleDisconnect: bleDisconnect
	};
	
});