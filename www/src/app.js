define(function() {

	var $$ = Dom7;

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

	return {
		f7: f7,
		mainView: mainView,
		load: load,
		sendMessage: sendMessage,
		path: path
	};
	
});