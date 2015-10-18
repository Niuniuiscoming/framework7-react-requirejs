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

    return {
        startActivity: startActivity
    };
    
});