# 音视频通话功能说明

PC端音视频通话功能，分为两个版本：普通版和高级版，两个版本之间不互通。

## 前置条件说明

1. 浏览器支持webrtc
2. 电脑有麦克风，且工作正常
3. 电脑有扬声器，且工作正常
4. 刷新浏览器时，会有如下日志输出，```console.log(`detectRTC, isWebRTCSupported: ${DetectRTC.isWebRTCSupported}, hasWebcam: ${DetectRTC.hasWebcam}, hasSpeakers: ${DetectRTC.hasSpeakers}, hasMicrophone: ${DetectRTC.hasMicrophone}`, this.isSupportVoip);```
，只有所有输出都为true时，音视频功能才能正常工作。

## 功能库说明

1. ```engine-conference.min.js``` 高级版，最高支持9路视频通话
2. ```engine-multi.min.js``` 普通版，最高支持4路视频通话
3. ```engine.min.js```默认和```engine-multi.min.js```一致

## 开发说明

0. 项目默认使用普通版音视频SDK，即```engine-multi.min.js```
1. 根据具体情况，使用```engine-conference.min.js``` 或 ```engine-multi.min.js``` 替换 ```engine.min.js```

## 调试
音视频通话窗口的控制台会输出`wfc avengine-multi`或者`wfc avengine-conference`分别当前使用的是多人版或高级版音视频 SDK
