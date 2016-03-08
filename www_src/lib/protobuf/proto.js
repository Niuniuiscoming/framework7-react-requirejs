//arraybuffer转base64编码
function arrayBufferToBase64(buffer) {
	var binary = '';
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}
//base64解码成arraybuffer
function _base64ToArrayBuffer(base64) {
	var binary_string = window.atob(base64);
	var len = binary_string.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes.buffer;
}

//字符转数组
function stringToUtf8ByteArray(str) {
	str = str.replace(/\r\n/g, '\n');
	var out = [],
		p = 0;
	for (var i = 0; i < str.length; i++) {
		var c = str.charCodeAt(i);
		if (c < 128) {
			out[p++] = c;
		} else if (c < 2048) {
			out[p++] = (c >> 6) | 192;
			out[p++] = (c & 63) | 128;
		} else {
			out[p++] = (c >> 12) | 224;
			out[p++] = ((c >> 6) & 63) | 128;
			out[p++] = (c & 63) | 128;
		}
	}
	return out;
};

//数组转arraybuffer
function toArrayBuffer(buffer) {
	var ab = new ArrayBuffer(buffer.length);
	var view = new Uint8Array(ab);
	for (var i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return ab;
}


//ArrayBufferToString
function uintToString(uintArray) {
	function pad(n) {
		return n.length < 2 ? "0" + n : n;
	}
	var array = new Uint8Array(uintArray);
	var str = "";
	for (var i = 0, len = array.length; i < len; ++i) {
		str += ("%" + pad(array[i].toString(16)))
	}
	str = decodeURIComponent(str);
	return str;
}


//解析温度
function analysis(oldArray) {
	var newArray = new Array(oldArray.length / 2);
	for (var i = 0; i < newArray.length; i++) {
		if ((oldArray[i * 2] & 0x80) == 0x80) {
			newArray[i] = ((~((oldArray[i*2] << 8 & 0xFF00) | oldArray[i*2+1])) & 0xFFFF) + 1;
			newArray[i] = -newArray[i];
		} else {
			newArray[i] = (oldArray[i*2] << 8 & 0xFF00) | oldArray[i*2+1];
		}
	}
	return newArray;
}

//创建proto	
var ProtoBuf = dcodeIO.ProtoBuf;
var DevCmd = ProtoBuf.loadProtoFile("js/duoxieyun-ble.proto").build("DevCmd");
var DevResponse = ProtoBuf.loadProtoFile("js/duoxieyun-ble.proto").build("DevResponse");
var DevCfg = ProtoBuf.loadProtoFile("js/duoxieyun-ble.proto").build("DevCfg");
var DevCfgFixed = ProtoBuf.loadProtoFile("js/duoxieyun-ble.proto").build("DevCfgFixed");
var DevStatus = ProtoBuf.loadProtoFile("js/duoxieyun-ble.proto").build("DevStatus");
var DevDataPack = ProtoBuf.loadProtoFile("js/duoxieyun-ble.proto").build("DevDataPack");
var SendDataRequest = ProtoBuf.loadProtoFile("js/duoxieyun-ble.proto").build("SendDataRequest");
var RecvDataPush = ProtoBuf.loadProtoFile("js/duoxieyun-ble.proto").build("RecvDataPush");
var BasePush = ProtoBuf.loadProtoFile("js/duoxieyun-ble.proto").build("BasePush");
var BaseRequest = ProtoBuf.loadProtoFile("js/duoxieyun-ble.proto").build("BaseRequest");

//序列化大部分指令（只需要指令序号）
function serializeMost(num) {
	var devCmd = new DevCmd();
	devCmd.Cmd = num;
	console.info("指令：" + devCmd.Cmd);
	var buffer = devCmd.toArrayBuffer();
	console.info(new Uint8Array(buffer));
	return buffer;
}

//序列化指令0、1、2
function serializeZeroOneTwo(num, paramString) {
	var devCmd = new DevCmd();
	devCmd.Cmd = num;
	console.info("指令：" + devCmd.Cmd);
	var utf8_buffer = stringToUtf8ByteArray(paramString);
	var arraybuffer = toArrayBuffer(utf8_buffer);
	devCmd.ParamString = arraybuffer;
	var buffer = devCmd.toArrayBuffer();
	var msgDec = DevCmd.decode(buffer);
	console.info("msgDec.Cmd：" + msgDec.Cmd);
	var offset = msgDec.ParamString.offset;
	var limit = msgDec.ParamString.limit;
	console.info(new Uint8Array(buffer));
	console.info(uintToString(msgDec.ParamString.buffer.slice(offset, limit)));
	return buffer;
}

//序列化指令3
function serializeThree(num, content, logInterval, highThreshold, highToleranceTime, lowThreshold, lowToleranceTime) {
	var devCmd = new DevCmd();
	devCmd.Cmd = num;
	console.info("指令：" + devCmd.Cmd);
	var devCfg = new DevCfg();
	var utf8_buffer = stringToUtf8ByteArray(content);
	var arraybuffer = toArrayBuffer(utf8_buffer);
	devCfg.Content = arraybuffer;
	devCfg.LogInterval = logInterval;
	devCfg.HighThreshold = highThreshold;
	devCfg.HighToleranceTime = highToleranceTime;
	devCfg.LowThreshold = lowThreshold;
	devCfg.LowToleranceTime = lowToleranceTime;
	devCmd.DevCfg = devCfg;
	var buffer = devCmd.toArrayBuffer();
	var msgDec = DevCmd.decode(buffer);
	console.info("msgDec.Cmd：" + msgDec.Cmd);
	var offset = msgDec.DevCfg.Content.offset;
	var limit = msgDec.DevCfg.Content.limit;
	console.info(uintToString(msgDec.DevCfg.Content.buffer.slice(offset, limit)));
	console.info(new Uint8Array(msgDec.DevCfg.Content.buffer.slice(offset, limit)));
	console.info(new Uint8Array(buffer));
	console.info(new Uint8Array(msgDec.DevCfg.Content.buffer));
	return buffer;
}

//序列化指令6
function serializeSix(num, paramUint32) {
	var devCmd = new DevCmd();
	devCmd.Cmd = num;
	console.info("指令：" + devCmd.Cmd);
	devCmd.ParamUint32 = paramUint32;
	var buffer = devCmd.toArrayBuffer();
	var msgDec = DevCmd.decode(buffer);
	console.info("msgDec.ParamUint32:" + msgDec.ParamUint32);
	console.info("msgDec.Cmd：" + msgDec.Cmd);
	console.info(new Uint8Array(buffer));
	return buffer;
}

//设置包头
function setLabour(data) {
	var buffer = new ArrayBuffer(8 + data.byteLength);
	var x = new DataView(buffer, 0);
	x.setInt8(0, 254);
	x.setInt8(1, 1);
	x.setInt16(2, data.byteLength + 8);
	x.setInt16(4, 30001);
	x.setInt16(6, 0);
	var array = new Uint8Array(data);
	for (var i = 0; i < data.byteLength; i++) {
		x.setInt8(8 + i, array[i]);
	}
	console.info(new Uint8Array(buffer));
	return buffer;
}

//发送大部分指令（只需要指令序号）
function sendMost(num) {
	var recvDataPush = new RecvDataPush();
	var basePush = new BasePush();
	recvDataPush.Data = serializeMost(num);
	recvDataPush.BasePush = basePush;
	var data = recvDataPush.toArrayBuffer();
	console.info(new Uint8Array(data));
	var buffer = setLabour(data); //最终传给设备的包
	//	var arrayBuffer = buffer.slice(8);
	//	var msgDec = RecvDataPush.decode(arrayBuffer);
	//	var offset = msgDec.Data.offset;
	//	var limit = msgDec.Data.limit;
	//	console.info(new Uint8Array(arrayBuffer));
	//	console.info(msgDec);
	//	console.info(new Uint8Array(msgDec.Data.buffer.slice(offset, limit)));
	return buffer;
}

//发送指令0、1、2
function sendZeroOneTwo(num, paramString) {
	var recvDataPush = new RecvDataPush();
	var basePush = new BasePush();
	recvDataPush.Data = serializeZeroOneTwo(num, paramString);
	recvDataPush.BasePush = basePush;
	var data = recvDataPush.toArrayBuffer();
	console.info(new Uint8Array(data));
	var buffer = setLabour(data);
	//	var arrayBuffer = buffer.slice(8);
	//	var msgDec = RecvDataPush.decode(arrayBuffer);
	//	var offset = msgDec.Data.offset;
	//	var limit = msgDec.Data.limit;
	//	console.info(new Uint8Array(arrayBuffer));
	//	console.info(msgDec);
	//	console.info(new Uint8Array(msgDec.Data.buffer.slice(offset, limit)));
	return buffer;
}

//发送指令3
function sendThree(num, content, logInterval, highThreshold, highToleranceTime, lowThreshold, lowToleranceTime) {
	var recvDataPush = new RecvDataPush();
	var basePush = new BasePush();
	recvDataPush.Data = serializeThree(num, content, logInterval, highThreshold, highToleranceTime, lowThreshold, lowToleranceTime);
	recvDataPush.BasePush = basePush;
	var data = recvDataPush.toArrayBuffer();
	console.info(new Uint8Array(data));
	var buffer = setLabour(data);
	//	var arrayBuffer = buffer.slice(8);
	//	var msgDec = RecvDataPush.decode(arrayBuffer);
	//	var offset = msgDec.Data.offset;
	//	var limit = msgDec.Data.limit;
	//	console.info(new Uint8Array(arrayBuffer));
	//	console.info(msgDec);
	//	console.info(new Uint8Array(msgDec.Data.buffer.slice(offset, limit)));
	return buffer;
}

//发送指令6
function sendSix(num, paramUint32) {
	var recvDataPush = new RecvDataPush();
	var basePush = new BasePush();
	recvDataPush.Data = serializeSix(num, paramUint32);
	recvDataPush.BasePush = basePush;
	var data = recvDataPush.toArrayBuffer();
	var base = arrayBufferToBase64(data);
	console.info(base);
	console.info(new Uint8Array(data));
	var buffer = setLabour(data);
	var base64 = arrayBufferToBase64(buffer);
	console.info(base64);
	//	var arrayBuffer = buffer.slice(8);
	//	var msgDec = RecvDataPush.decode(arrayBuffer);
	//	var offset = msgDec.Data.offset;
	//	var limit = msgDec.Data.limit;
	//	console.info(new Uint8Array(arrayBuffer));
	//	console.info(msgDec);
	//	console.info(new Uint8Array(msgDec.Data.buffer.slice(offset, limit)));
	return buffer;
}

//收到DevResponse
function receviceDevResponse(buffer) {
	var msgDec = SendDataRequest.decode(buffer);
	var offset = msgDec.Data.offset;
	var limit = msgDec.Data.limit;
	var data = DevResponse.decode(msgDec.Data.buffer.slice(offset, limit));
	return data;
}

//收到DevStatus
function receviceDevStatus(buffer) {
	var msgDec = SendDataRequest.decode(buffer);
	var offset = msgDec.Data.offset;
	var limit = msgDec.Data.limit;
	var data = DevStatus.decode(msgDec.Data.buffer.slice(offset, limit));
	return data;
}

//收到DevDevCfg
function receviceDevCfg(buffer) {
	var msgDec = SendDataRequest.decode(buffer);
	var offset = msgDec.Data.offset;
	var limit = msgDec.Data.limit;
	var data = DevCfg.decode(msgDec.Data.buffer.slice(offset, limit));
	console.info(analysisContent(data.Content));
	return data;
}

//收到DevCfgFixed
function receviceDevCfgFixed(buffer) {
	var msgDec = SendDataRequest.decode(buffer);
	var offset = msgDec.Data.offset;
	var limit = msgDec.Data.limit;
	var data = DevCfgFixed.decode(msgDec.Data.buffer.slice(offset, limit));
	return data;
}

//收到DevDataPack
function receviceDevDataPack(buffer) {
	var msgDec = SendDataRequest.decode(buffer);
	var offset = msgDec.Data.offset;
	var limit = msgDec.Data.limit;
	var data = DevDataPack.decode(msgDec.Data.buffer.slice(offset, limit));
	return data;
}

//解析bytes类型的变量
function analysisBytes(content){
	var offset = content.offset;
	var limit = content.limit;
	var result=uintToString(content.buffer.slice(offset, limit))
	return result;
}


//解析温度
function analysisTemp(content){
	var offset = content.offset;
	var limit = content.limit;
	var array=new Uint8Array(content.buffer.slice(offset));
	var newArray=analysis(array);
	return newArray;
}


function recevice() {
	var buffer = _base64ToArrayBuffer("CAMSKAC+ALwAvAC8ALwAvAC8AL4AvAC8AL4AvAC8ALwAvAC+AL4AvAC8ALw=");
	var data = DevDataPack.decode(buffer);
	console.info(data);
	console.info(analysisTemp(data.DevData));
	return data;
}