Cordova插件开发测试项目
==============

本项目主要用来调试插件开发，技术采用framework7+requirejs+react+pubsubjs，因此本项目可视为整合框架用来做开发基础。

#####包含已测试的插件:
- [cordova-plugins-activity](https://github.com/cfansimon/cordova-plugins-activity)
- [cordova-plugin-ble-central](https://github.com/don/cordova-plugin-ble-central)

#####部分截图
<img src="https://raw.githubusercontent.com/cfansimon/framework7-react-requirejs/master/screenshot/Screenshot_2015-09-10-11-49-50.png" width="200px" />
<img src="https://raw.githubusercontent.com/cfansimon/framework7-react-requirejs/master/screenshot/Screenshot_2015-10-20-23-43-14.png" width="200px" />
<img src="https://raw.githubusercontent.com/cfansimon/framework7-react-requirejs/master/screenshot/Screenshot_2015-10-20-23-43-18.png" width="200px" />
<img src="https://raw.githubusercontent.com/cfansimon/framework7-react-requirejs/master/screenshot/Screenshot_2015-10-20-23-43-41.png" width="200px" />

#####开发流程:
-提前条件：自行安装nodejs、grunt、cordova-cli、babel

先安装nodejs依赖
```bash
$ npm install
```
shell进入www_src目录，启动jsx即时编译，--compact 压缩(变量名不压缩) --no-comments 删除注释
```bash
babel --watch src/ --out-dir build/ --compact --no-comments
```
修改代码过程中运行以下命令，会自动刷新浏览器显示结果
```bash
$ grunt debug
```
一个阶段编码结束后，运行以下命令，可以压缩合并部分js源码和html页面(www_src/src目录下源码暂不压缩)到根目录的www目录
```bash
$ grunt build
```
最终浏览器再预览一遍，看看压缩后的代码有没有出错
```bash
$ grunt server
```
完成工作，Android的真机调试，记得先插上手机，再运行以下命令
```bash
$ cordova run
```

特别说明：对于js测试不了的插件，需要在android studio中测试，比如蓝牙插件，可以先用以下命令把全部源码拷贝到android
```bash
$ grunt build-src && cordova build
```
然后把根目录下platforms/android工程导入到android studio中做开发测试
