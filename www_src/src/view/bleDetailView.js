define(function(require, exports, module) {

    var app = require("app");
    var pubsub = require("common/pubsub");
    var dxsdk = require("common/dx-sdk");
    var toolkit = require("common/toolkit");

    var currentPeripheral = null;
    var loop = true;

    var PageContent = React.createClass({
        getInitialState: function() {
            return {
                infoData: {},
                infoProgress: [0, 100],
                tempData: {},
                tempProgress: [0, 100]
            };
        },
        componentWillMount: function() {
            var that = this;
            var deviceId = this.props.deviceId;
            
            // 同步手机时间到模块
            this.syncTime(deviceId, afterSyncTime);

            function afterSyncTime() {
                loop = true;
                that.getBleStatus(deviceId, afterGetBleStatus);
                // setTimeout(function() {
                //     dxsdk.sys.disconnect(deviceId, function() {
                //         that.getBleStatus(deviceId, afterGetBleStatus);
                //     });
                // }, 2000);
            }
            function afterGetBleStatus() {
                loop && that.getBleTempData(deviceId, afterGetBleTempData);
            }
            function afterGetBleTempData() {
                loop && that.getBleStatus(deviceId, afterGetBleStatus);
            }
        },
        getBleStatus: function(deviceId, afterSuccess) {
            var that = this;
            this.getConnection(deviceId, function(peripheral) {
                //获取设备基本信息
                dxsdk.api.status(peripheral, function(data) {
                    if (data.time) { //格式化时间戳
                        data.time = toolkit.date('Y-m-d H:m:s', data.time);
                    }
                    that.setState({infoData: data});
                    afterSuccess && afterSuccess();
                }, function(errorMsg) {
                    //断开一瞬间可能会提示失败，设置成断开后不提示
                    loop && app.alert("基本信息获取失败，" + errorMsg + "，请返回后重新连接");
                }, function(progress) {
                    that.setState({infoProgress: progress});
                });
            });
        },
        getBleTempData: function(deviceId, afterSuccess) {
            var that = this;
            this.getConnection(deviceId, function(peripheral) {
                //获取温度数据
                dxsdk.api.currentData(peripheral, function(data) {
                    that.setState({tempData: data});
                    afterSuccess && afterSuccess();
                }, function(errorMsg) {
                    app.alert("温度数据获取失败，" + errorMsg + "，请返回后重新连接");
                }, function(progress) {
                    that.setState({tempProgress: progress});
                });
            });
        },
        syncTime: function(deviceId, onComplete) {
            this.getConnection(deviceId, function(peripheral) {
                // 每次连接后把本地时间同步到记录仪
                dxsdk.api.syncTime(peripheral, function(data) {
                    if (data.time) { //格式化时间戳
                        data.time = toolkit.date('Y-m-d H:m:s', data.time);
                    }
                    app.notify('提示', '时间同步成功 ' + data.time);
                    onComplete && onComplete();
                }, function() {
                    app.notify('警告', '时间同步失败');
                    onComplete && onComplete();
                });
            });
        },
        getConnection: function(deviceId, onSuccess) {
            var that = this;
            dxsdk.sys.isConnected(deviceId, function() {
                if (currentPeripheral && currentPeripheral.id == deviceId) {
                    onSuccess && onSuccess(currentPeripheral);
                } else { //缓存的currentPeripheral不是当前deviceId的要重新连接
                    that.setConnection(deviceId, function(peripheral) {
                        onSuccess && onSuccess(peripheral);
                    });
                }
            }, function() {
                that.setConnection(deviceId, function(peripheral) {
                    onSuccess && onSuccess(peripheral);
                });
            });
        },
        setConnection: function(deviceId, onSuccess) {
            dxsdk.sys.connect(deviceId, function(peripheral){
                currentPeripheral = peripheral;
                onSuccess && onSuccess(peripheral);
            }, function(errorMsg) {
                app.alert('连接失败：' + errorMsg);
            }, function() {
                app.alert('连接中断，请返回后重新连接');
            });
        },
        render: function() {
            return (
                <div className="page-content">
                    <BleInfo data={this.state.infoData} progress={this.state.infoProgress}/>
                    <CurrentTemp data={this.state.tempData} progress={this.state.tempProgress}/>
                </div>
            );
        }
    });

    // 显示记录仪基本信息
    var BleInfo = React.createClass({
        getInitialState: function() {
            return {
                data: {},
                progress: this.props.progress
            };
        },
        getDefaultProps: function() {
            return {
                fields: [
                    {key: "id", title: "设备id"},
                    {key: "time", title: "设备时间"},
                    {key: "ver", title: "固件版本"},
                    {key: "voltage", title: "设备电压"}
                ]
            };
        },
        componentWillReceiveProps: function(nextProps) {
            if (nextProps.progress[0] == nextProps.progress[1]) { //进度100%
                this.setState({data: nextProps.data});
            } else {
                this.setState({progress: nextProps.progress});
            }
        },
        render: function() {
            return (
                <div className="list-block">
                    <ul>
                        {this.props.fields.map(function(item, i) {
                            var itemValue = this.state.data[item.key] || parseInt(this.state.progress[0]*100/this.state.progress[1]) + '% loading';
                            return (
                                <li key={i}>
                                    <div className="item-content">
                                        <div className="item-inner">
                                            <div className="item-title label">{item.title}</div>
                                            <div className="item-input">
                                                {itemValue}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        }, this)}
                    </ul>
                </div>
            );
        }
    });
    
    // 显示当前温度
    var CurrentTemp = React.createClass({
        getInitialState: function() {
            return {
                data: {},
                progress: this.props.progress
            };
        },
        componentWillReceiveProps: function(nextProps) {
            if (nextProps.progress[0] == nextProps.progress[1]) { //进度100%
                this.setState({data: nextProps.data});
            } else {
                this.setState({progress: nextProps.progress});
            }
        },
        render: function() {
            var temp = this.state.data['temp'] || parseInt(this.state.progress[0]*100/this.state.progress[1]) + '% loading';
            var tempStyle = {
                textAlign: 'center',
                padding: '10px',
                fontSize: '50px',
                color: '#2196f3'
            }
            return (
                <div className="card">
                    <div className="card-header">实时温度(°C)</div>
                    <div className="card-content">
                        <div className="card-content-inner">
                            <p style={tempStyle}>{temp}</p>
                        </div>
                    </div>
                </div> 
            );
        }
    });

    return {
        init: function(query) {
            var deviceId = query.deviceId.replace(/%3A/ig, ":");

            // 回退前先断开连接
            $$("#ble-detail-back").click(function(){
                loop = false;
                dxsdk.sys.disconnect(deviceId, function() {
                    app.mainView.router.back();
                });
            });

            React.render(<PageContent deviceId={deviceId}/>, document.getElementById('page-ble-detail'));
        }
    };
});