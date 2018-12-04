# react-native-http-cus
http请求，上传文件，下载文件

###  安装组件：
npm i --save react-native-http-cus

###  上传文件，下载文件需安装组件
[npm i --save react-native-fs 文件操作](https://github.com/itinance/react-native-fs)<BR/>

##### Http 网路请求(方法参数请查看源文件)
```javascript
import Http from "react-native-http-cus";
Http.post();//基于 fetch 封装的 POST请求
Http.get();//基于 fetch 封装的 Get请求
Http.requestAjax();//基于 ajax 封装的 网络请求
Http.urlFile = "";//上传文件 接口
Http.fileField = "";//文件上传包含文件的字段，可不传
Http.setRNFS();//设置react-native-fs文件组件对象 
Http.upLoadFileToService();//上传文件 react-native-fs
Http.downloadFile();//下载文件 react-native-fs
```

##### 示例
```javascript
import RNFS from " react-native-fs";
import Http from "react-native-http-cus";

//请求接口
Http.post("接口地址",{ff:"dd"})
.then(result=>{});//基于 fetch 封装的 POST请求
Http.get("接口地址",{ff:"dd"})
.then(result=>{});//基于 fetch 封装的 Get请求
Http.requestAjax("接口地址",{ff:"dd"})
.then(result=>{});//基于 ajax 封装的 网络请求

//上传文件，下载文件
Http.urlFile = "http://";//上传文件 接口
Http.fileField = "ff";//文件上传包含文件的字段，可不传
Http.setRNFS(RNFS);//设置react-native-fs文件组件对象 
Http.upLoadFileToService([{localPath:'文件路径'}])
.then(result=>{});//上传文件 react-native-fs
Http.downloadFile("文件下载地址")
.then(result=>{});//下载文件 react-native-fs
```
