define(["app", "common/pubsub", "common/jq-printer-sdk"], function(app, pubsub, printersdk) {

    var discoveredDevices = [];

    var PageContent = React.createClass({
        render: function() {
            return (
                <div className="page-content">
                    <PairedDeviceList/>
                    <ScanBtn/>
                    <DeviceList/>
                </div>
            );
        },
    });

    // 已配对的设备列表
    var PairedDeviceList = React.createClass({
        getInitialState: function() {
            return {
                devices: []
            };
        },
        componentDidMount: function() {
            var that = this;
            printersdk.sys.listPaired(function(devices) {
                that.setState({devices: devices});
            });
        },
        render: function() {
            return (
                <div>
                    <div className="content-block-title">已配对设备</div>
                    <div className="list-block">
                        <ul>
                            {this.state.devices.map(function(item, i) {
                              return (
                                <li className="item-content" key={item.id}>
                                  <div className="item-inner">
                                    <div className="item-title">{item.name}({item.id})</div>
                                    <div className="item-after">
                                        <PrintBtn deviceId={item.id}/>
                                    </div>
                                  </div>
                                </li>
                              );
                            }, this)}
                        </ul>
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
                scanLabel: "搜索新设备",
                isScan: false
            };
        },

        handleScan: function() {
            var that = this;
            if (!that.state.isScan)  {
                that.setState({
                    scanLabel: "搜索中...",
                    isScan: true
                });

                //清空
                discoveredDevices = [];
                pubsub.publish('scan', discoveredDevices);

                printersdk.sys.discoverUnpaired(function(devices) {
                    discoveredDevices = devices;
                    pubsub.publish('scan', discoveredDevices);
                    that.setState({
                        scanLabel: "搜索新设备",
                        isScan: false
                    });
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
            var that = this;
            this.pubsub_token = pubsub.subscribe('scan', function(topic, discoveredDevices) {
                that.setState({ devices: discoveredDevices });
            });
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
                                    <PrintBtn deviceId={item.id}/>
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
    
    var PrintBtn = React.createClass({
        connect: function(deviceId, onSuccess) {
            app.preloader.show("连接设备...");
            printersdk.sys.connect(deviceId, function(){
                app.preloader.hide();
                onSuccess && onSuccess();
            }, function(errorMsg) {
                app.preloader.hide();
                // Device connection was lost
                app.alert('连接失败：' + errorMsg);
            });
        },
        handlePrint: function() {
            //模拟温度历史数据
            var head = {time: '时间', temp1: '温度1', temp2: '温度2', temp3: '温度3'};
            var data = [
                {time: '01-19 9:00:00', temp1: 15.1, temp2: 16.1, temp3: 18.1},
                {time: '01-19 9:00:15', temp1: 16.2, temp2: 17.1, temp3: 18.1},
                {time: '01-19 9:00:30', temp1: 16.5, temp2: 17.5, temp3: 18.5}
            ];
            
            this.connect(this.props.deviceId, function() {
                printersdk.api.printTable(head, data, function() {
                    printersdk.sys.disconnect(); //每次打印后需要断开
                    alert('ok');
                });
            });
        },
        render: function() {
            return (
                <a className="button color-blue" onClick={this.handlePrint}>开始打印</a>
            );
        },
    });

    return {
        init: function() {
            React.render(<PageContent/>, document.getElementById('page-ble-printer'));
        }
    };
});