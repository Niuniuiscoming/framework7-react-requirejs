define(["common/dx-sdk"], function(dxsdk) {

    window.$$ = Dom7;

    $$(document).on('pageBeforeInit', function (e) {
        var page = e.detail.page;
        load(page.name, page.query);
    });

    var f7 = new Framework7({
        pushState: true
    });

    var mainView = f7.addView('.view-main', {
        dynamicNavbar: true
    });

    var isLoading = false;

    var indicator = {
        show: function() {
            if (!isLoading) {
                f7.showIndicator();
                isLoading = true;
            }
        },
        hide: function() {
            if (isLoading) {
                f7.hideIndicator();
                isLoading = false;
            }
        }
    }

    var preloader = {
        show: function(msg) {
            if (!isLoading) {
                f7.showPreloader(msg);
                isLoading = true;
            }
        },
        hide: function() {
            if (isLoading) {
                f7.hidePreloader();
                isLoading = false;
            }
        }
    }

    var alert = function(msg) {
        f7.alert(msg, "提示");
    }

    //HTML绑定对应的react view模块
    function load(moduleName, query) {
        require(['view/' + moduleName + 'View'], function(module) {
            module.init(query);
        });
    }

    //view模块之间传递消息
    function sendMessage(moduleName, message) {
        require(['view/' + moduleName + 'View'], function(module) {
            module.receiveMessage(message);
        });
    }

    //生成跳转URL
    function path(pageName, query) {
        if (query) {
            return 'page/' + pageName + '.html?' + $$.serializeObject(query);
        }
        return 'page/' + pageName + '.html';
    }

    //配置dxsdk
    dxsdk.setConfig({
        preloader: preloader,
        alert: alert
    });

    return {
        f7: f7,
        mainView: mainView,
        indicator: indicator,
        preloader: preloader,
        alert: alert,
        load: load,
        sendMessage: sendMessage,
        path: path
    };
  
});