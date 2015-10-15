define(["app", "plugins"], function(app, plugins) {
	var PageContent = React.createClass({
		render: function() {
			var blePath = app.path('ble');
			return (
				<div className="page-content">
					<p><a href="#" className="button" onClick={this.openActivity}>打开原生Activity</a></p>
					<p><a href={blePath} className="button">打开蓝牙测试</a></p>
				</div>
			);
		},

		openActivity: function() {
			var data = {
		        id:10001,
		        name:"Simon",
		        age:28
		    };
	        plugins.startActivity("com.zlzkj.vendor.MyActivity",data,function(data){
	            alert(data.id+"::"+data.name);
	        });
		}
	});

	return {
		init: function() {
			React.render(<PageContent />, document.getElementById('page-default'));
		}
	};
});