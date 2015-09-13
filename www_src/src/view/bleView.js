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
                plugins.ble.stopScan(function() {
                    that.setState({
                        scanLabel: "开始扫描",
                        isScan: false
                    });
                });
            } else { //未扫描
                that.setState({
                    scanLabel: "停止扫描",
                    isScan: true
                });

                //清空
                discoveredDevices = [];
                pubsub.publish('scan', discoveredDevices);

                plugins.ble.startScan([], function(device) {
                    //发现一个设备则回调一次
                    discoveredDevices.push(device);
                    pubsub.publish('scan', discoveredDevices);
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
                                    <UploadBtn seq={i}/>
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

    var UploadBtn = React.createClass({
        getInitialState: function() {
            return {
                status: 'unConnected',
                label: '上传数据',
                btnDisabled: false
            };
        },
        handleConnect: function(i) {
            var that = this;
            that.setState({
                status: "connecting",
                label: '连接中...',
                btnDisabled: true
            });
            plugins.ble.connect(discoveredDevices[i].id, function(peripheral){
                that.setState({
                    status: "connected",
                    label: '连接成功'
                });
                console.log(JSON.stringify(peripheral));
                that.handleSendData(peripheral);
            });
        },
        handleDisconnect: function(deviceId) {
            var that = this;
            plugins.ble.disconnect(deviceId, function(){
                that.setState({
                    status: 'unConnected',
                    label: '上传数据',
                    btnDisabled: false
                });
            });
        },
        handleSendData: function(peripheral) {
            var that = this;
            var data = plugins.ble.stringToBytes("bbb");
            plugins.ble.write(peripheral, data, function(){
                alert("send ok!");
                that.handleDisconnect(peripheral.id);
            }, function(errorMsg){
                // alert("指令发送失败:" + errorMsg);
                that.handleDisconnect(peripheral.id);
            });
        },
        render: function() {
            var className = "button active";
            if (this.state.btnDisabled) {
                className = "button active disabled";
            }
            return (
                <a href="#" className={className} onClick={this.handleConnect.bind(this, this.props.seq)}>{this.state.label}</a>
            );
        },
    });

    return {
        init: function() {
            React.render(<PageContent/>, document.getElementById('page-ble'));
        }
    };
});