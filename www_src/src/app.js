define(["common/dx-sdk"], function(dxsdk) {

    window.$$ = Dom7;

    $$(document).on('pageAfterAnimation', function (e) {
        var page = e.detail.page;
        load(page.name, page.query);
    });

    var f7 = new Framework7({
        pushState: true,
        modalTitle: '提示',
        modalButtonOk: '确定',
        modalButtonCancel: '取消'
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

    var notify = function(title, message) {
    	var instance = f7.addNotification({
            title: title,
            message: message
        });
        setTimeout(function() {
        	f7.closeNotification(instance);
        }, 1000*5);
    }

    //HTML绑定对应的react view模块
    function load(moduleName, query) {
    	if (!query) {
    		query = {};
    	}
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
        alert: alert
    });

    return {
        f7: f7,
        mainView: mainView,
        indicator: indicator,
        preloader: preloader,
        alert: alert,
        notify: notify,
        load: load,
        sendMessage: sendMessage,
        path: path
    };
  
});