define(["app", "plugins", "common/pubsub", "common/dx-sdk"], function(app, plugins, pubsub, dxsdk) {

    var discoveredDevices = [];

    var PageContent = React.createClass({
        render: function() {
            return (
                <div className="page-content">
                    <ScanBtn/>
                    <DeviceList/>
                    <div ref="resultDiv">
                    </div>
                </div>
            );
        },
    });

    var ScanBtn = React.createClass({
        render: function() {
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
                dxsdk.sys.stopScan(function() {
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

                dxsdk.sys.startScan([], function(device) {
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
    
    var connectedBtnIndex = null;
    var UploadBtn = React.createClass({
        getInitialState: function() {
            return {
                label: '点击连接',
                connected: false,
                deviceId: null
            };
        },
        handleClick: function(i) {
            var that = this;
            if (!that.state.connected) { //未连接状态
                that.setState({
                    label: '正在连接'
                });
                dxsdk.sys.connect(discoveredDevices[i].id, function(peripheral){
                    connectedBtnIndex = i; //标记当前按钮已连接
                    that.setState({
                        label: '断开连接',
                        connected: true,
                        deviceId: discoveredDevices[i].id
                    });
                    dxsdk.api.status(peripheral, function(data){
                        alert(JSON.stringify(data));
                    });
                }, function(errorMsg){
                    alert('连接失败：' + errorMsg);
                    that.setState({
                        label: '点击连接'
                    });
                });
            } else {
                that.setState({
                    label: '正在断开'
                });
                dxsdk.sys.disconnect(that.state.deviceId, function(){
                    that.setState({
                        label: '点击连接'
                    });
                });
            }
            
        },
        render: function() {
            return (
                <a href="#" className="button color-blue" onClick={this.handleClick.bind(this, this.props.seq)}>{this.state.label}</a>
            );
        },
    });

    return {
        init: function() {
            React.render(<PageContent/>, document.getElementById('page-ble'));
        }
    };
});