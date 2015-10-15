define(["app", "plugins", "common/pubsub"], function(app, plugins, pubsub) {

    var discoveredDevices = [];

    var PageContent = React.createClass({
        render: function() {
            return (
                <div className="page-content">
                    <ScanBtn/>
                    <DeviceList/>
                    <div className="list-block">
                      <ul>
                        <li>
                          <div className="item-content">
                            <div className="item-inner">
                              <div className="item-input">
                                <input id="myInput" type="text" placeholder="Command" />
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
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
                label: '上传数据'
            };
        },
        handleConnect: function(i) {
            var that = this;
            that.setState({
                label: '正在连接'
            });
            plugins.ble.connect(discoveredDevices[i].id, function(peripheral){
                that.setState({
                    label: '连接成功'
                });
                // console.log(JSON.stringify(peripheral));
                //禁用所有上传按钮
                $$(".button").addClass('disabled');
                that.handleSendData(peripheral);
            }, function(errorMsg){
                alert('连接失败：' + errorMsg + '，请重试');
                that.setState({
                    label: '上传数据'
                });
            });
        },
        handleDisconnect: function(deviceId) {
            var that = this;
            plugins.ble.disconnect(deviceId);
            that.setState({
                label: '上传数据'
            });
            $$(".button").removeClass('disabled');
        },
        handleSendData: function(peripheral) {
            var that = this;
            var data = $$('#myInput').val();
            plugins.ble.write(peripheral, data, function(){
                // console.log('data sended:'+data);
                that.setState({
                    label: '等待响应1'
                });
                that.handleReceiveData(peripheral);
            }, function(errorMsg){
                alert("指令\"" + data + "\"发送失败:" + errorMsg);
                that.handleDisconnect(peripheral.id);
            });
        },
        handleReceiveData: function(peripheral) {
            var that = this;
            var isReceived = false;
            plugins.ble.startNotify(peripheral, function(data){
                alert("接收成功:" + data);
                that.handleDisconnect(peripheral.id);
                isReceived = true;
            }, function(errorMsg){
                alert("接收失败:" + errorMsg);
                that.handleDisconnect(peripheral.id);
            });
            setTimeout(function(){
                if (!isReceived) {
                    alert("等待超时，15秒内设备未响应");
                    that.handleDisconnect(peripheral.id);
                }
            },15000);
        },
        render: function() {
            return (
                <a href="#" className="button color-blue" onClick={this.handleConnect.bind(this, this.props.seq)}>{this.state.label}</a>
            );
        },
    });

    return {
        init: function() {
            React.render(<PageContent/>, document.getElementById('page-ble'));
        }
    };
});