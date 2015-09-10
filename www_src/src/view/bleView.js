/** @jsx React.DOM */
define(["app", "plugins", "common/pubsub"], function(app, plugins, pubsub) {

    var discoveredDevices = [];

    var PageContent = React.createClass({
        render: function() {
            return (
                <div className="page-content">
                    <ScanBtn/>
                    <DeviceList/>
                </div>
            );
        },
    });

    var ScanBtn = React.createClass({
        render: function() {
            var blePath = app.path('ble');
            return (
                <p><a href="#" className="button" onClick={this.handleScan}>{this.state.scanLabel}</a></p>
            );
        },

        getInitialState: function() {
            return {
                scanLabel: "开始扫描",
                isScan: false
            };
        },

        handleScan: function() {
            var that = this;
            if (that.state.isScan) { //扫描中
                plugins.bleStopScan(function() {
                    that.setState({
                        scanLabel: "开始扫描",
                        isScan: false
                    });
                }, function() {
                    alert("扫描停止失败，请重试");
                });
            } else { //未扫描
                that.setState({
                    scanLabel: "停止扫描",
                    isScan: true
                });

                //清空
                discoveredDevices = [];
                pubsub.publish('scan', discoveredDevices);

                plugins.bleStartScan([], function(device) {
                    //发现一个设备则回调一次
                    discoveredDevices.push(device);
                    pubsub.publish('scan', discoveredDevices);
                }, function() {
                    alert("扫描启动失败，请重试");
                });
            }
        }
    });

    var DeviceList = React.createClass({
        getInitialState: function() {
            return {
                devices: discoveredDevices
            };
        },
        componentDidMount: function() {
            //pubsub_token用于unsubscribe
            this.pubsub_token = pubsub.subscribe('scan', function(topic, discoveredDevices) {
                this.setState({ devices: discoveredDevices });
            }.bind(this));
        },
        componentWillUnmount: function() {
            pubsub.unsubscribe(this.pubsub_token);
        },
        handleUploadData: function(i) {
            alert(this.state.devices[i].id);
        },
        render: function() {
            return (
                <div className="list-block">
                    <ul>
                        {this.state.devices.map(function(item, i) {
                          return (
                            <li className="item-content" key={item.id}>
                              <div className="item-inner">
                                <div className="item-title">{item.name}({item.id})</div>
                                <div className="item-after">
                                    <a href="#" className="button active" onClick={this.handleUploadData.bind(this, i)} key={i}>上传数据</a>
                                </div>
                              </div>
                            </li>
                          );
                        }, this)}
                    </ul>
                </div>
            );
        },
    });

    return {
        init: function() {
            React.render(<PageContent/>, document.getElementById('page-ble'));
        }
    };
});