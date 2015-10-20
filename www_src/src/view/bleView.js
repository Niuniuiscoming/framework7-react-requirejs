define(["app", "common/pubsub", "common/dx-sdk"], function(app, pubsub, dxsdk) {

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
                                    <UploadBtn deviceId={item.id}/>
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
        render: function() {
            var path = app.path('bleDetail', {deviceId: this.props.deviceId});
            return (
                <a className="button color-blue" href={path}>连接设备</a>
            );
        },
    });

    return {
        init: function() {
            React.render(<PageContent/>, document.getElementById('page-ble'));
        }
    };
});