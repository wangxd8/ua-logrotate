## 描述

ua全称user-agent，用于记录用户请求的ua日志

## 安装

    npm install ua-logrotate

## 配置参数
- `app` (默认空) 设置日志所在文件夹名称，如设置test,默认状态生成的日志存放路径为`/data/logs/test/xxxx.log`,如果一台服务器部署多个项目，建议设置
- `max_size` (默认`10M`): 设置每份日志文件的最大值: `10G`, `10M`, `10K`
- `file_num` (默认保存`30`份日志文件): 设置保存日志的最大份数.
- `dateFormat` (默认`YYYY-MM-DD_HH`) : 默认日志文件生成格式
- `workerInterval` (默认检查日志文件时间`30`秒) : 设置检查日志文件大小的时间间隔
- `rotateInterval` (默认每天凌晨 `0 0 * * *`): 设置定时检查日志文件大小，遵循node-schedule设置风格 [node-schedule](https://github.com/node-schedule/node-schedule) 
- `log_path` (默认 `/data/logs/`) 设置日志文件存放路径，如果默认路径不存在，则会创建

```
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    |
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
```

### 如何使用ua-logrotate ?

 ```js
    var ua = require('./index')
    ua({
        'app':'test',
        'log':ctx.request.header
        ....
    })