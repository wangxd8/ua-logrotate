/**
 *  useragent 日志
 *  param: path 日志存放路径，默认 /data/logs/ua
 *         max_size 设置每个日志文件的最大值，默认10M 
 *         file_num  设置文件数量 默认30
 *         dateFormat 日志名称，默认YYYY-MM-DD_HH-mm-ss.log
 *         workerInterval 可以设置检查日志的时间间隔，默认1min 
 *         rotateInterval 自定义检查日志文件间隔，遵循node-schedule定时规则
 */

var path = require('path')
var schedule = require('node-schedule')
var moment = require('moment')
var fs = require('fs')

var ua_logs_path='/data/logs/'

var ua_log = {}
ua_log.init = function(param){
    var that = this
    this.param = param
    this.max_size= this.get_limit_size(), // 默认10M
    this.file_num = 3
    this.dateFormat = 'YYYY-MM-DD_HH-mm-ss'
    this.workerInterval = isNaN(parseInt(param['workerInterval']))? 30*1000:parseInt(param['workerInterval']) * 1000; // 默认30s
    this.rotateInterval = param['rotateInterval']||'0 0 * * *' // 默认每天凌晨
    //this.field = param['field']?param['field']:'' // 需要保存的字段 暂时默认保存header信息
    ua_logs_path = param['log_path']?param['log_path']:ua_logs_path
    var out_path = param['app']?ua_logs_path+param['app']+'/out.log':ua_logs_path+'/out.log'
    setInterval(function(){
        that.files_size(out_path)
    },that.workerInterval);
    schedule.scheduleJob(that.rotateInterval,function(){
        that.files_size(out_path,true)
    });
    // 新来的数据要先写入out.log里面
    if(param['log']){
       ua_log.create_outlog(param)
    }
}
ua_log.create_outlog = function(param){
    var user_agent = param['log']['user-agent']||''
    var ua = ''
    if(user_agent){
      ua = this.destory_ua(user_agent)
    }
    if(ua){
        ua = Object.assign(ua,param['log'])
    }else{
        ua = param['log']
    }
    // if(this.field&&ua){
    //     var field = this.field.split(',')
    //     for(var i=0;i<field.length;i++){
    //         ua[field[i]]
    //     }
    // }
    var write =function(){
        fs.writeFile(ua_logs_path+param['app']+'/out.log',JSON.stringify(ua),'utf8',function(err){
            if(err) {
                console.log(err);
            }
            console.log('创建日志成功')
        })
    } 
    // 判断目录是否存在
     fs.stat(ua_logs_path+param['app']+'/out.log',function(err,stat){
        if(stat&&stat.isFile()){ // 文件存在
            write()
        }else{ // 文件不存在
            fs.mkdir(ua_logs_path+param['app'], function (err) {
                fs.open(ua_logs_path+param['app']+'/out.log','a+',function(e){
                    if(e){ 
                        throw e;
                    }
                    write()
                })
            })
        }
    })
    
}
ua_log.mkdirs = function (dirname, callback) {  
    fs.exists(dirname, function (exists) {  
        if (exists) {  
            callback();  
        } else {  
            //console.log(path.dirname(dirname));  
            mkdirs(path.dirname(dirname), function () {  
                fs.mkdir(dirname, callback);  
            });  
        }  
    });  
} 
// 写文件
ua_log.proceed = function(file){
    var that = this
    var final_time = moment().format(this.dateFormat)
    var final_name = file.substr(0, file.length - 4) + '__' + final_time + '.log';
    var readStream = fs.createReadStream(file);
    var writeStream = fs.createWriteStream(final_name,{'flags':'w+'})
    readStream.pipe(writeStream);
    readStream.on('error',function(){})
    writeStream.on('error',function(){})
    writeStream.on('finish',function(){
        readStream.close();
        writeStream.close();
        fs.truncate(file,function(err){
            if(err) return ''
            if(typeof(that.file_num)==='number'){
                ua_log.delete_old(file)
            }
        })
    })

}
// 判断文件大小
ua_log.files_size = function(file,force){
    if (!fs.existsSync(file)) return;
    var that = this;
    fs.stat(file, function (err, data) {
        if (err) return console.error(err);
        if (data.size > 0 && (data.size >= that.max_size)||force) { 
            that.proceed(file);
        }
    });
}
// 获取设置文件大小
ua_log.get_limit_size = function() {
    var max_size = this.param['max_size']||10000
    if (typeof(max_size) !== 'string'){
        max_size = max_size + "";
    }else if (max_size.slice(-1) === 'G'){
      return (parseInt(max_size) * 1024 * 1024 * 1024);
    }else if (max_size.slice(-1) === 'M'){
      return (parseInt(max_size) * 1024 * 1024);
    }else if (max_size.slice(-1) === 'K'){
      return (parseInt(max_size) * 1024)
    }
    return parseInt(max_size);
}
// 删除历史文件
ua_log.delete_old = function(file){
  if (file === "/dev/null") return;
  var that = this;
  var fileBaseName = file.substr(0, file.length - 4).split('/').pop()+'__';
  var dirName = path.dirname(file);
  fs.readdir(dirName, function(err, files) {
    var i, len;
    if (err) return '';
    var rotated_files = [];
    for (i = 0, len = files.length; i < len; i++) {
      if (files[i].indexOf(fileBaseName) >= 0)
        rotated_files.push(files[i]);
    }
    rotated_files.sort().reverse();
    for (i = rotated_files.length - 1; i >= that.file_num; i--) {
      (function(i) {
        fs.unlink(path.resolve(dirName, rotated_files[i]), function (err) {
          if (err) return console.error(err);
          console.log('"' + rotated_files[i] + '" 被删除');
        });
      })(i);
    }
  }); 
}
//处理ua数据
ua_log.destory_ua = function(data){
    return data?this.formatUa(data):''
}
ua_log.formatUa = function (ua) {
    ua = 'Mozilla/5.0 (Linux; Android 8.0.0; ALP-AL00 Build/HUAWEIALP-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/63.0.3239.111 Mobile Safari/537.36 Android/060506_6.5.6_0291_0801 (Asia/Shanghai) app/1 ibb/1.0.0'
    var reg = /^(Mozilla\/5\.0) \((.+)\) .*(ios|android|windowsphone|windows|mac|macos)\/([^ ]+) \(([^ ]+)\)(.*)$/i
    var exe = reg.exec(ua)
    var phoneInfo = exe[2] ? exe[2].split('; ') : []
    var sysType = this.getSysType(exe[3].toUpperCase())
    var sysVersion = sysType === '14' ? phoneInfo[2] : phoneInfo[1]
    var phone = sysType === '14' ? phoneInfo[3] : PHONE
    var res = {
      phone,
      software: exe[1],
      sysName: exe[3],
      sysType,
      sysVersion
    }
    return res
  }
  
  ua_log.getSysType = function (type) {
    var res = '14'
    switch (type) {
      case 'WINDOWS':
        res = '09'
        break
      case 'UNIX':
        res = '10'
        break
      case 'LINUX':
        res = '11'
        break
      case 'MAC':
        res = '12'
        break
      case 'IOS':
        res = '13'
        break
      case 'ANDROID':
        res = '14'
        break
    }
    return res
  }
module.exports = function(param){
    ua_log.init(param)
}