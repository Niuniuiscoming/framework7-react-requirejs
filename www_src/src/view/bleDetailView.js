define(["app", "common/pubsub", "common/dx-sdk"], function(app, pubsub, dxsdk) {

    var PageContent = React.createClass({
        getInitialState: function() {
            return {
                data: {},
                progress:[0, 100]
            };
        },
        componentWillMount: function() {
            var that = this;
            dxsdk.sys.connect(this.props.deviceId, function(peripheral){
                dxsdk.api.status(peripheral, function(data) {
                    that.setState({
                        data: data
                    });
                }, that.onProgress);
            }, function(errorMsg) {
                app.alert('连接失败：' + errorMsg);
                //退回列表页面
                app.mainView.router.back();
            });
        },
        onProgress: function(progress) {
            this.setState({
                progress: progress
            });
        },
        render: function() {
            return (
                <div className="page-content">
                    <BleInfo data={this.state.data} progress={this.state.progress}/>
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
                if (nextProps.data) {
                    this.setState({
                        data: nextProps.data
                    });
                }
            } else {
                this.setState({
                    progress: nextProps.progress
                });
            }
        },
        render: function() {
            return (
                <div className="list-block">
                    <ul>
                        {this.props.fields.map(function(item, i) {
                            var itemValue = this.state.data[item.key] || "Loading " + parseInt(this.state.progress[0]*100/this.state.progress[1]) + "%";
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
    // var CurrentTemp = React.createClass({
    //     getInitialState: function() {
    //         return {
    //             data: {}
    //         };
    //     },
    //     componentWillReceiveProps: function(nextProps) {
    //         if (this.props.data) {
    //             this.setState({
    //                 data: nextProps.data
    //             });
    //         }
    //     },
    //     render: function() {
    //         return (
    //             <div className="list-block">
    //                 <ul>
    //                     {this.props.fields.map(function(item, i) {
    //                         return (
    //                             <li key={i}>
    //                                 <div className="item-content">
    //                                     <div className="item-inner">
    //                                         <div className="item-title label">{item.title}</div>
    //                                         <div className="item-input">
    //                                             {this.state.data[item.key]}
    //                                         </div>
    //                                     </div>
    //                                 </div>
    //                             </li>
    //                         );
    //                     }, this)}
    //                 </ul>
    //             </div>
    //         );
    //     }
    // });

    return {
        init: function(query) {
            var deviceId = query.deviceId.replace(/%3A/ig, ":");

            // 回退前先断开连接
            $$("#ble-detail-back").click(function(){
                dxsdk.sys.disconnect(deviceId, function() {
                    app.mainView.router.back();
                });
            });

            React.render(<PageContent deviceId={deviceId}/>, document.getElementById('page-ble-detail'));
        }
    };
});