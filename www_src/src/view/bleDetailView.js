define(["app", "common/pubsub", "common/dx-sdk"], function(app, pubsub, dxsdk) {

    var BleInfo = React.createClass({
        getInitialState: function() {
            return {
                data: {},
                fields: []
            };
        },
        componentDidMount: function() {
            var that = this;
            dxsdk.sys.connect(this.props.deviceId, function(peripheral){
                dxsdk.api.status(peripheral, function(data){
                    that.setState({
                        data: data,
                        fields: [
                            {key: "id", title: "设备id"},
                            {key: "time", title: "设备时间"},
                            {key: "ver", title: "固件版本"},
                            {key: "voltage", title: "设备电压"}
                        ]
                    });
                });
            }, function(errorMsg){
                alert('连接失败：' + errorMsg);
            });
        },
        render: function() {
            return (
                <div className="list-block">
                    <ul>
                        {this.state.fields.map(function(item, i) {
                            return (
                                <li key={i}>
                                    <div className="item-content">
                                        <div className="item-inner">
                                            <div className="item-title label">{item.title}</div>
                                            <div className="item-input">
                                                {this.state.data[item.key]}
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

    return {
        init: function(query) {
            //配置sdk
            // dxsdk.setConfig();
            var deviceId = query.deviceId.replace(/%3A/ig, ":");
            React.render(
                <div className="page-content">
                    <BleInfo deviceId={deviceId}/>
                </div>
                , document.getElementById('page-ble-detail')
            );
        }
    };
});