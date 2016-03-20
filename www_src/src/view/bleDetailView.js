define(function(require, exports, module) {

    var app = require("app");
    var pubsub = require("common/pubsub");
    var toolkit = require("common/toolkit");
    var dxsdk = require("common/dx-sdk");

    var currentPeripheral = null;
    var loop = true;

    var PageContent = React.createClass({
        getInitialState: function() {
            return {
                infoData: {},
                infoProgress: [0, 100],
                tempData: {},
                cfgData: {},
                tempProgress: [0, 100]
            };
        },
        componentDidMount: function() {
            var that = this;
            var deviceId = this.props.deviceId;
            loop = true;

            this.syncTime(deviceId, function() { // 同步手机时间到模块
                that.getBleCfgFixed(deviceId, function() { //获取固件信息
                    that.getBleCfg(deviceId, function() { //获取配置信息，如记录开始时间、间隔等
                        that.getBleTempData(deviceId); //循环获取实时温度
                        setInterval(function() {
                            loop && that.getBleTempData(deviceId);
                        },1000*30);
                    });
                });
            });
        },
        getBleCfgFixed: function(deviceId, afterSuccess) {
            var that = this;
            this.getConnection(deviceId, function(peripheral) {
                //获取设备基本信息
                dxsdk.api.cfgFixed(peripheral, function(data) {
                    that.setState({infoData: data});
                    afterSuccess && afterSuccess();
                }, function(errorMsg) {
                    //断开一瞬间可能会提示失败，设置成断开后不提示
                    loop && app.alert("记录仪基本信息获取失败，" + errorMsg + "，请返回后重新连接");
                }, function(progress) {
                    that.setState({infoProgress: progress});
                });
            });
        },
        getBleCfg: function(deviceId, afterSuccess) {
            var that = this;
            this.getConnection(deviceId, function(peripheral) {
                //获取设备基本信息
                dxsdk.api.cfg(peripheral, function(data) {
                    console.log('读取的配置信息:');
                    console.log(data);
                    that.setState({cfgData: data});
                    afterSuccess && afterSuccess();
                }, function(errorMsg) {
                    app.alert("记录仪配置信息获取失败，" + errorMsg + "，请返回后重新连接");
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
            app.preloader.show("同步时间...");
            this.getConnection(deviceId, function(peripheral) {
                // 每次连接后把本地时间同步到记录仪
                dxsdk.api.syncTime(peripheral, function() {
                    app.preloader.hide();
                    onComplete && onComplete();
                }, function(msg) {
                    app.preloader.hide();
                    console.log(msg);
                    app.alert('时间同步失败，请返回重试');
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
            app.preloader.show("连接设备...");
            dxsdk.sys.connect(deviceId, function(peripheral){
                currentPeripheral = peripheral;
                app.preloader.hide();
                onSuccess && onSuccess(peripheral);
            }, function(errorMsg) {
                app.preloader.hide();
                app.alert('连接失败：' + errorMsg);
            }, function() {
                app.alert('连接中断，请返回后重新连接');
            });
        },
        setCfg: function() {
            var that = this;
            var params = {
                content: '哈哈镜',
                logInterval: 199,
                highThreshold: 35,
                highToleranceTime: 5,
                lowThreshold: -10,
                lowToleranceTime: 5
            };
            this.getConnection(that.props.deviceId, function(peripheral) {
                loop = false;
                dxsdk.api.setCfg(peripheral, params, function() {
                    console.log('参数设置成功');
                    loop = true;
                }, function(errorMsg) {
                    app.alert("参数设置失败，" + errorMsg + "，请重试");
                }, function(progress) {
                    
                });
            });
        },
        handleUpload: function() {
            var that = this;
            this.getConnection(that.props.deviceId, function(peripheral) {
                loop = false;
                setTimeout(function() { //
                    // 先获取历史数据，新版蓝牙中num已经不作为真实数据总数的依据
                    if (that.state.tempData['num']) { 
                        dxsdk.api.historyData(peripheral, function(data) {
                            var dataWithTime = [];
                            for(var i in data) {
                                dataWithTime[i] = {
                                    temp: data[i],
                                    time: that.state.tempData['logTime'] + that.state.cfgData['logInterval']*i
                                }
                            }
                            console.log('dataWithTime', dataWithTime);
                        }, function(errorMsg) {
                            app.alert("温度历史数据获取失败，" + errorMsg + "，请返回后重新连接");
                        }, function(progress) {
                            // console.log('progress', progress);
                            // that.setState({tempProgress: progress});
                        });
                    } else {
                        app.alert('当前历史记录条数为空，无法上传');
                    }
                    
                }, 1000*3);
            });
        },
        render: function() {
            return (
                <div className="page-content">
                    <BleInfo data={this.state.infoData} progress={this.state.infoProgress}/>
                    <CurrentTemp data={this.state.tempData} progress={this.state.tempProgress}/>
                    <div className="content-block row">
                      <div className="col-50">
                        <a className="button button-big button-green" onClick={this.setCfg}>参数设置</a>
                      </div>
                      <div className="col-50">
                        <a className="button button-big button-green" onClick={this.handleUpload}>上传数据</a>
                      </div>
                    </div>
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
                    {key: "ver", title: "固件版本"},
                    {key: "ssid", title: "SSID"},
                    {key: "mac", title: "MAC"}
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
            var isRecording = this.state.data['isRecording'];
            var num = this.state.data['num'];
            var isRecordingStr = '';
            var numStr = '';
            var timeStr = toolkit.date('H:i:s', this.state.data['time']);
            var voltageStr = '';
            if (this.state.data['voltage']) {
                voltageStr = '电量' + this.state.data['voltage'] + '%'
            }
            if (isRecording) {
                isRecordingStr = '正在录制';
            } else {
                if (num == 0) {
                    isRecordingStr = '未开始录制';
                } else {
                    isRecordingStr = '录制完成';
                    numStr = '本次' + (num ? num : '...') + '条记录';
                }
            }
            var tempStyle = {
                textAlign: 'center',
                padding: '10px',
                fontSize: '50px',
                color: '#2196f3'
            }
            return (
                <div className="card">
                    <div className="card-header">实时温度(°C) {timeStr} {voltageStr}</div>
                    <div className="card-content">
                        <div className="card-content-inner">
                            <p style={tempStyle}>{temp}</p>
                        </div>
                    </div>
                    <div className="card-footer">{isRecordingStr} {numStr}</div>
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
                    currentPeripheral = null; //退出后清空缓存
                    app.mainView.router.back();
                });
            });

            React.render(<PageContent deviceId={deviceId}/>, document.getElementById('page-ble-detail'));
        }
    };
});