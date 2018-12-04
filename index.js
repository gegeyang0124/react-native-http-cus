/**
 * 基于 fetch 封装的 GET请求
 * @param url
 * @param params {}
 * @param headers
 * @returns {Promise}
 */
import {
    NetInfo,
    Platform,
} from 'react-native';

var RNFS = {};

import Indicator from 'react-native-toast-loadding';

/**
 * 网路请求
 * **/
export default class Http {

    static urlFile = null;//文件上传接口
    static fileField = null;//文件上传包含文件的字段，可不传
    static platformType = Platform.OS == "ios" ? true : false;//true:ios,false:android

    static destDownload = null ;//下载目录

    /**
     * 设置文件组件对象
     * @param rnfs object;//react-native-fs 文件组件对象
     * **/
    static setRNFS(rnfs={}){
        RNFS = rnfs;

        this.destDownload = RNFS.DocumentDirectoryPath
            ? Platform.OS == "ios"
                ? `${RNFS.DocumentDirectoryPath}/download`
                : `${RNFS.ExternalStorageDirectoryPath}/download`
            : null ;//下载目录
    }

    /**
     * toast消息提示
     * @param msg string,//显示消息
     * **/
    static toast(msg=''){
        Indicator.show(false,msg);
        setTimeout(()=>{
            Indicator.hide();
        },2000);
    }

    static verfyComponent(type = 1){
        let b = true;
        switch (type){
            case 1:{
                if(!RNFS.DocumentDirectoryPath){
                    console.info("请安装文件操作组件","react-native-fs");
                    this.toast("请安装组件 react-native-fs");
                    b = false;
                }

                break;
            }
        }

        return b;
    }

    static getConnectionInfo(){
        return new Promise((resolve,reject) => {
            NetInfo.getConnectionInfo()
                .then((connectionInfo) => {
                    if((connectionInfo.type != "none" && Http.platformType)
                        || (!Http.platformType && connectionInfo.type != "NONE")
                        || (__DEV__ && connectionInfo.type != "none"
                            && connectionInfo.type != "NONE"))
                    {
                        resolve(connectionInfo);
                    }
                    else
                    {
                        this.toast("未连接网络");

                        reject({status:"未连接网络"});
                    }
                });
        });
    }

    /**
     * 基于 ajax 封装的 网络请求
     * @param type strng; //请求类型GET或POST
     * @param url string; //请求地址
     */
    static requestAjax(type,url){
        let timeout = true;

        let fetchTimeout = new Promise((resolve,reject)=>{
            setTimeout(()=>{
                    if(timeout){
                        console.log("-----------------------------------------httpAjax " + url + " Timeout start-------------------------------------");
                        console.log("-----------------------------------------httpAjax " + url + " Timeout end-------------------------------------");

                        reject({status:"Timeout"});
                    }
                },
                15000);
        });

        // alert(JSON.stringify(fetchOptions))
        let fetchPromise =  new Promise((resolve, reject)=>{

            this.getConnectionInfo()
                .then((connectionInfo) => {
                    var request = new XMLHttpRequest();

                    request.onreadystatechange = (e) => {
                        if (request.readyState !== 4) {
                            return;
                        }
                        timeout = false;
                        if (request.status === 200) {
                            console.log("-----------------------------------------httpAjax " + url + " success start-------------------------------------");
                            console.info('success', request.responseText);
                            console.log("-----------------------------------------httpAjax " + url + " success end-------------------------------------");
                            resolve(request.responseText);
                            //alert(request.responseText)
                        } else {
                            console.log("-----------------------------------------httpAjax " + url + " err start-------------------------------------");
                            console.log('err');
                            console.log("-----------------------------------------httpAjax " + url + " err end-------------------------------------");

                            reject({status:-1});

                        }
                    };

                    request.open(type, url);
                    request.send();

                    // alert(JSON.stringify(connectionInfo));
                    // console.log('Initial, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
                })
                .catch(retJson=>{
                    reject(retJson);
                });

        });

        /**
         * 其中一个谁先执行，其他的会被舍弃
         * **/
        return Promise.race([fetchPromise,fetchTimeout]);
    }

    /**
     * 基于 ajax 封装的 网络请求
     * @param url string; //请求地址
     */
    static getAjax(url){
        return this.requestAjax("GET",url);
    }

    /**
     * 基于 ajax 封装的 网络请求
     * @param url string; //请求地址
     */
    static postAjax(url){
        return this.requestAjax("POST",url);
    }

    /**
     * 通过经纬度获取详细地址（百度接口）
     * @param lat int,//纬度
     * @param lng int,//经度
     * **/
    static getAddress(lat,lng){
        let locationJson = {
            city:null,//城市名
            cityCode:null,//城市代码
            address:null,//地址
            lat:lat,//维度
            lng:lng,//经度
            timestamp:new Date().getTime(),
        };
        return new Promise(resolve => {
            this.getConnectionInfo()
                .then((connectionInfo) => {
                    // location: {log:113.264531,lat:23.157003},
                    /*let url = "http://api.map.baidu.com/geocoder/v2/?" +
                        "ak=C93b5178d7a8ebdb830b9b557abce78b&callback=renderReverse&location="
                        + lat + "," + lng +"&pois=0";*/

                    /* let url = "https://restapi.amap.com/v3/assistant/coordinate/convert?" +
                         "locations=113.32007372983196,23.120272663850958&coordsys=gps" +
                         "&output=json&key=9f6788450fe0354d26fdb9a46ffd728b";*/
                    let url = "https://restapi.amap.com/v3/assistant/coordinate/convert?" +
                        "locations=" + lng + "," + lat + "&coordsys=gps" +
                        "&output=json&key=9f6788450fe0354d26fdb9a46ffd728b";



                    this.getAjax(url).then(retJson2=>{

                        retJson2 = JSON.parse(retJson2);
                        // retJson2.locations = "113.31420850684037,23.09863836095986";

                        url = "https://restapi.amap.com/v3/geocode/regeo?output=json&" +
                            "location=" + retJson2.locations + "&key=9f6788450fe0354d26fdb9a46ffd728b" +
                            "&radius=100&extensions=all";

                        let locations = retJson2.locations.split(",");


                        this.getAjax(url)
                            .then(retJson=>{
                                let response = JSON.parse(retJson);

                                /*let response = JSON.parse(retJson.substring(retJson.indexOf('{'), (retJson.lastIndexOf("}") + 1)));
                                let locationJson = {
                                    city:response.result.addressComponent.city,//城市名
                                    cityCode:response.result.addressComponent.adcode,//城市代码
                                    address:response.result.formatted_address,//地址
                                    lat:response.result.location.lat,//维度
                                    lng:response.result.location.lng,//经度
                                    timestamp:new Date().getTime(),
                                };*/

                                /*let locationJson = {
                                    city:response.regeocode.addressComponent.city,//城市名
                                    cityCode:response.regeocode.addressComponent.adcode,//城市代码
                                    address:response.regeocode.formatted_address,//地址
                                    lat:locations[1],//维度
                                    lng:locations[0],//经度
                                    timestamp:new Date().getTime(),
                                };*/
                                locationJson.city = response.regeocode.addressComponent.city;//城市名
                                locationJson.cityCode = response.regeocode.addressComponent.adcode;//城市代码
                                locationJson.address = response.regeocode.formatted_address;//地址
                                locationJson.lat = locations[1];//维度
                                locationJson.lng = locations[0];//经度
                                locationJson.timestamp = new Date().getTime();

                                console.info("locationJson",locationJson);

                                resolve(locationJson);
                            })
                            .catch(()=>{
                                resolve(locationJson);
                            });



                    });
                })
                .catch(()=>{
                    resolve(locationJson);
                });
        });
    }

    /**
     * 基于 fetch 封装的 网络请求
     * @param type strng; //请求类型GET或POST
     * @param url string; //请求地址
     * @param params json; //地址请求参数 json params中可以用isNotUser来控制是否附加用户ID isNotUser:true =》不附加用户ID，默认附加用户id
     * @param headers json; //地址请求头 json
     * @param isDefaultHeaders bool; //是否使用默认请求头，false：不使用，true：使用，不传默认使用
     * @param isProgress bool; //是否使用加载条，false：不使用，true：使用，不传默认使用
     * @returns {Promise}
     */
    static request(type,url, params = {},isProgress, headers,isDefaultHeaders){

        params = JSON.parse(JSON.stringify(params));

        if(isProgress == undefined)
        {
            isProgress = true;
        }

        isProgress = isProgress == undefined ? true : isProgress;

        isDefaultHeaders = isDefaultHeaders == undefined ? true : isDefaultHeaders;
        headers = isDefaultHeaders && headers == undefined ? {} : headers;
        if(isDefaultHeaders)
        {
            headers["Content-Type"] = "application/json";
            headers["Accept"] = "application/json";
        }

        let fetchOptions =  headers == undefined ?
            {method: type}
            :{
                method: type,
                headers: headers,
            };

        params = params == undefined ? {} : params;

        //删除params数据中的isNotUser属性
        // delete params["isNotUser"];


        let timer = null;
        let timeout = true;
        let fetchTimeout = new Promise((resolve,reject)=>{
            timer = setTimeout(()=>{
                if(timeout){
                    isProgress ? Indicator.hide() : null;
                    console.log("-----------------------------------------httpRequest " + url + " Timeout start-------------------------------------");
                    console.info("requestData:",params);

                    reject({status:"Timeout"});
                    console.log("-----------------------------------------httpRequest " + url + " Timeout end-------------------------------------");
                }

            },30000);
        });

        let urlV = url;

        if (type.toUpperCase() == "GET" && params != null && params != undefined) {
            let paramsArray = [];
            //encodeURIComponent
            Object.keys(params).forEach(key => paramsArray.push(key + '=' + params[key]));

            if (url.search(/\?/) === -1)
            {
                url += '?' + paramsArray.join('&');
            }
            else
            {
                url += '&' + paramsArray.join('&');
            }
        }
        else if(type.toUpperCase() == "POST" )
        {
            fetchOptions["body"] = JSON.stringify(params);
        }

        // alert(JSON.stringify(fetchOptions))
        let fetchPromise =  new Promise((resolve, reject)=>{

            if(false){

            }
            else {
                this.getConnectionInfo()
                    .then((connectionInfo) => {

                        isProgress ? Indicator.show(true, "加载中...") : null;

                        //alert(JSON.stringify(fetchOptions))
                        fetch(url, fetchOptions)
                            .then((response) => {

                                clearTimeout(timer);
                                timeout = false;

                                isProgress ? Indicator.hide() : null;
                                if (response.ok) {

                                    return response.json();

                                }
                                else {
                                    console.log("-----------------------------------------httpRequest " + url + " error-------------------------------------");
                                    console.info("requestData:",params);
                                    console.info("errInfo:",response);
                                    console.log("-----------------------------------------httpRequest " + url + " error end-------------------------------------");

                                    this.toast("后台报错,请联系管理员");
                                    return {retCode:-40440};
                                }
                            })
                            .then((response) => {
                                if(response.retCode == -40440){
                                    reject({status: -1});

                                    return response;
                                }

                                console.log("-----------------------------------------httpRequest " + url + " success start-------------------------------------");
                                console.info("requestData:",params);
                                console.info("response:",response);
                                console.log("-----------------------------------------httpRequest " + url + " success end-------------------------------------");

                                try {
                                    resolve(response);
                                }
                                catch (e){

                                    console.log("-----------------------------------------httpRequest " + url + " error-------------------------------------");
                                    console.info("requestData:",params);
                                    console.info("exception:",e);
                                    console.log("-----------------------------------------httpRequest " + url + " error end-------------------------------------");
                                    this.toast("后台报错，返回为空(undefined)");
                                    reject({
                                        status:-1,
                                        info:'response为undefined',
                                    });
                                }



                            })
                            .catch(err => {

                                clearTimeout(timer);

                                isProgress ? Indicator.hide() : null;

                                // TalkingData.trackEventHttp("exception",urlV,type,params);

                                console.log("-----------------------------------------httpRequest " + url + " error-------------------------------------");
                                console.info("requestData:",params);
                                console.info("err:",err);
                                console.log("-----------------------------------------httpRequest " + url + " error end-------------------------------------");
                                this.toast("请求失败，找不到服务器，请联系管理员");
                                reject({status: -1});
                            });

                        // alert(JSON.stringify(connectionInfo));
                        // console.log('Initial, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
                    })
                    .catch(retJson=>{

                        clearTimeout(timer);

                        // isProgress ? Indicator.hide() : null;
                        reject(retJson);
                    });
            }

        });

        /**
         * 其中一个谁先执行，其他的会被舍弃
         * **/
        return Promise.race([fetchPromise,fetchTimeout]);

    }

    /**
     * 基于 fetch 封装的 Get请求  FormData 表单数据
     * @param url string; //请求地址
     * @param params json; //地址请求参数 json
     * @param headers json; //地址请求头 json
     * @param isDefaultHeaders bool; //是否使用默认请求头，false：不使用，true：使用，不传默认使用
     * @returns {Promise}
     */
    static get(url, params, isProgress, headers,isDefaultHeaders) {

        return this.request("GET",url, params, isProgress, headers,isDefaultHeaders);
    }

    /**
     * 基于 fetch 封装的 POST请求  FormData 表单数据
     * @param url string; //请求地址
     * @param params json; //地址请求参数 json
     * @param headers json; //地址请求头 json
     * @param isDefaultHeaders bool; //是否使用默认请求头，false：不使用，true：使用，不传默认使用
     * @returns {Promise}
     */
    static post(url, params,isProgress, headers,isDefaultHeaders) {

        return this.request("POST",url, params, isProgress, headers,isDefaultHeaders);
    }

    /**
     * 上传文件
     * @param filePath string,//文件路径
     * @param mimeType string,//文件类型
     * **/
    static upLoadFile(filePath,mimeType){

        if(filePath == undefined)
        {
            return;
        }

        return new Promise((resolve, reject)=>{
            /*reject = reslv;
             resolve = rej;*/
            this.getConnectionInfo()
                .then((connectionInfo) => {

                    if(Http.platformType)
                    {
                        if(this.verfyComponent(1)){
                            // create an array of objects of the files you want to upload
                            var fileObj = {
                                // name: 'Filedata',
                                filename: filePath.substring(filePath.lastIndexOf("/") + 1),
                                filepath: filePath,
                                // filetype: 'multipart/form-data'
                            };
                            if(Http.fileField){
                                fileObj.name = Http.fileField;
                            }

                            var files = [
                                fileObj
                            ];

                            // upload files
                            RNFS.uploadFiles({
                                toUrl: Http.urlFile,
                                files: files,
                                method: 'POST',
                                headers: {
                                    // 'ContentType':'multipart/form-data',
                                    // Accept: 'application/json',
                                    // token:retJson.retData.token,
                                    // token:"cec2567515c751f96118833e4d050709",
                                },
                                fields: {
                                    // token:retJson.retData.token,
                                    // token:"cec2567515c751f96118833e4d050709",
                                },
                                begin: (response) => {
                                    // var jobId = response.jobId;
                                    // console.log('UPLOAD HAS BEGUN! JobId: ' + jobId);
                                },
                                progress: (response) => {
                                    var percentage = Math.floor(
                                        (response.totalBytesSent/response.totalBytesExpectedToSend)
                                    );

                                    // console.log('UPLOAD IS ' + percentage + '% DONE!');
                                    let per = parseInt(percentage * 1000) / 10;
                                    Indicator.show(true,per + "%");
                                }
                            })
                                .promise.then((response) => {

                                Indicator.hide();

                                console.log("-----------------------------------------httpRequest " + Http.urlFile + " success start-------------------------------------");
                                console.info("requestData:",files);
                                console.info("response:",response);
                                console.log("-----------------------------------------httpRequest " + Http.urlFile + " success end-------------------------------------");

                                if (response.statusCode == 200)
                                {
                                    response = JSON.parse(response.body);

                                    resolve(response);

                                }
                                else {
                                    this.toast("上传失败，请重试....");

                                    reject({status:-1});
                                }
                            })
                                .catch((err) => {
                                    Indicator.hide();
                                    this.toast("请检查网络....");

                                    if(err.description === "cancelled") {
                                        // cancelled by user
                                    }

                                    reject({status:-1});
                                });
                        }
                    }
                    else
                    {

                        let formData = new FormData();//如果需要上传多张图片,需要遍历数组,把图片的路径数组放入formData中
                        let file = {uri: filePath, type: 'multipart/form-data', name: filePath.substring(filePath.lastIndexOf("/") + 1)};   //这里的key(uri和type和name)不能改变,
                        formData.append("Filedata",file);   //这里的files就是后台需要的key


                        /*let formData = new FormData();
                         for(var i = 0;i<imgAry.length;i++){
                         let file = {uri: imgAry[i], type: 'multipart/form-data', name: 'image.png'};
                         formData.append("files",file);
                         }*/

                        Indicator.show(true,"正在上传");

                        fetch(Http.urlFile,{
                            method:'POST',
                            headers:{
                                'ContentType':'multipart/form-data',
                                // 'token':retJson.retData.token,
                            },
                            body:formData,
                        })
                            .then((response) => {
                                Indicator.hide();
                                if (response.ok) {

                                    return response.json();

                                }
                                else {

                                    this.toast("后台报错,请联系管理员");
                                    return {retCode:-40440};
                                }
                                // return response.json();
                            } )
                            .then((responseData)=>{

                                if(response.retCode == -40440){
                                    reject({status: -1});
                                }

                                console.log("-----------------------------------------httpRequest " + Http.urlFile + " success start-------------------------------------");
                                console.info("requestData:",files);
                                console.info("response:",responseData);
                                console.log("-----------------------------------------httpRequest " + Http.urlFile + " success end-------------------------------------");

                                resolve(responseData);

                                // console.log('responseData',responseData);
                            })
                            .catch((error)=>{
                                Indicator.hide();
                                this.toast("上传失败，请重试....");
                                reject({status:-1});
                                // alert("error: " + JSON.stringify(error));
                            });
                    }

                })
                .catch(retJson=>{
                    reject(retJson);
                });


        });

    }

    /**
     * 上传文件
     * @param filePathList array,//文件路径,成员是数据
     filePathList成员：{
        localPath: "文件路径",
     } 或 只有"文件路径"的一纬数组
     注：  可以含有任何字段并且一起返回，但不可将在字段放入返回成员的localPath和servicePath两个字段，
     否则servicePath会被替换，localPath放入本地路径则上传文件，若是网路路径，则跳过上传，路径存入
     servicePath字段
     * @param index int，//上传数组路径地址
     * @param count int，//上传数量
     *
     * return array;//成员含：{  localPath:'本地文件路径',
                        servicePath:'服务器回传路径',}
     * **/
    static upLoadFileToService(filePathList = [],index = 0,count = 1){

        return new Promise((resolve, reject) => {

            filePathList = filePathList == undefined ? [] :filePathList;
            count = count == undefined ? 1 :count;
            if(index == 0){
                let fileList = [];

                filePathList.forEach((v,i,a)=>{
                    if(typeof(v) == 'string'){
                        fileList.push({
                            localPath:v
                        });
                    }
                    else {
                        fileList.push(v);
                    }
                });

                filePathList = fileList;
            }

            if(filePathList.length > 0){

                index = index == undefined ? 0 : index;

                // console.info("filePathList",filePathList)

                this.upLoadFileToServicePutIn(filePathList,index,count,resolve);

            }
            else
            {
                resolve(filePathList);
            }


        });
    }

    static upLoadFileToServicePutIn(filePathList = [],index = 0,count = 1,resolve){
        if(filePathList[index].localPath.indexOf("http") == 0){
            filePathList[index].servicePath = filePathList[index].localPath;
            if(filePathList.length == (index + 1)){
                this.toast("上传完成");
                resolve(filePathList);
            }
            else
            {
                this.upLoadFileToServicePutIn(filePathList,++index,count,resolve);
            }
        }
        else {
            this.toast("第" + count + "张正在上传 ");

            this.upLoadFile(filePathList[index].localPath)
                .then(retJson=>{
                    // alert(JSON.stringify(retJson))
                    // filePathList[index].servicePath = retJson.url;
                    filePathList[index].servicePath = retJson;

                    if(filePathList.length == (index + 1)){
                        this.toast("上传完成");
                        resolve(filePathList);
                    }
                    else
                    {
                        this.upLoadFileToServicePutIn(filePathList,++index,++count,resolve);
                    }
                });
        }
    }

    /**
     * 下载文件
     * @param fileAddress string,//文件地址
     * @param downloadPath string,//下载存放文件目录路径 默认null,使用默认下载目录
     * @param isReDownload bool,//是否重新下载，默认false，false:若存在则不再下载，反之下载
     * resolve({
                  filePath:'',//返回下载文件的路径
              });
     * **/
    static downloadFile(fileAddress,downloadPath=null,isReDownload=false) {

        return  new Promise((resolve,reject)=>{

            if(fileAddress.indexOf("http") == 0){
                downloadPath = downloadPath ? downloadPath : this.destDownload;
                let downloadDest = downloadPath + `/${fileAddress.substring(fileAddress.lastIndexOf('/') + 1)}`;

                RNFS.mkdir&&RNFS.mkdir(downloadPath)
                    .then(()=>{
                        RNFS.exists(downloadDest)
                            .then((exist) =>{
                                if(!exist || isReDownload){
                                    this.getConnectionInfo()
                                        .then((connectionInfo) => {

                                            if(fileAddress == undefined)
                                            {
                                                this.toast("请传入文件地址");
                                                reject({status:-1});
                                            }

                                            // 音频
                                            //const downloadDest = `${RNFS.MainBundlePath}/${((Math.random() * 1000) | 0)}.mp3`;
                                            // let downloadDest = `${RNFS.MainBundlePath}/${fileAddress.substring(fileAddress.lastIndexOf('/') + 1)}`;
                                            // let downloadDest = `${RNFS.DocumentDirectoryPath}/${fileAddress.substring(fileAddress.lastIndexOf('/') + 1)}`;
                                            // http://wvoice.spriteapp.cn/voice/2015/0902/55e6fc6e4f7b9.mp3
                                            //const formUrl = 'http://wvoice.spriteapp.cn/voice/2015/0818/55d2248309b09.mp3';VideoView_android.js

                                            let options = {
                                                fromUrl: fileAddress,
                                                toFile: downloadDest,
                                                background: true,
                                                headers: {
                                                    // 'Cookie': cookie //需要添加验证到接口要设置cookie
                                                },
                                                begin: (res) => {
                                                    /*console.log('begin', res);
                                                     console.log('contentLength:', res.contentLength / 1024 / 1024, 'M');*/
                                                    // alert(JSON.stringify(res));
                                                },
                                                progress: (res) => {

                                                    //let per = (res.bytesWritten / res.contentLength).toFixed(3);
                                                    let per = (res.bytesWritten / res.contentLength);
                                                    // per = per * 1000;
                                                    // per = parseInt(per);
                                                    // per = per / 1000;

                                                    Indicator.show(true,(parseInt(per * 1000) / 10) + "%");
                                                }
                                            };

                                            try {
                                                let ret = RNFS.downloadFile(options);
                                                ret.promise.then(retJson => {
                                                    console.log("-----------------------------------------downloadFile " + fileAddress + " success start-------------------------------------");
                                                    console.info("response:",retJson);
                                                    console.log("-----------------------------------------downloadFile " + fileAddress + " success end-------------------------------------");

                                                    /* console.log('file://' + downloadDest)*/

                                                    retJson["filePath"] = downloadDest;
                                                    Indicator.hide();
                                                    resolve(retJson);

                                                }).catch(err => {
                                                    Indicator.hide();
                                                    reject(err);
                                                });
                                            }
                                            catch (e) {
                                                Indicator.hide();
                                                reject(e);
                                            }

                                        })
                                        .catch(retJson=>{
                                            reject(retJson);
                                        });
                                }
                                else
                                {
                                    resolve({
                                        filePath:downloadDest
                                    });
                                }
                            });
                    });

            }
            else
            {
                resolve({
                    filePath:fileAddress
                });
            }
        });

    }

}