**Centos7 定时任务**

**源于需要在 Centos7 周期性运行 Python 程序**

### 安装 crontabs 服务并设置开机自启动
```
yum install -y crontabs
systemctl enable crond.service
systemctl restart crond.service
systemctl status crond.service
```

### 设置用户自定义定时任务
crontab -e

下述代码是以调用阿里云SLS为例，会存在AKSA信息，可忽略。
```
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ALIBABA_CLOUD_ACCESS_KEY_ID=""
ALIBABA_CLOUD_ACCESS_KEY_SECRET=""
# PATH=/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root

# For details see man 4 crontabs

# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name  command to be executed

*/1 * * * * /usr/bin/python3 /root/sls/sls_tacacs_log.py >> /root/sls/sls_tacacs_log.log 2>&1
# */1 * * * * sleep 10 && /usr/bin/python3 /root/sls/sls_tacacs_log.py
# */1 * * * * sleep 20 && /usr/bin/python3 /root/sls/sls_tacacs_log.py
# */1 * * * * sleep 30 && /usr/bin/python3 /root/sls/sls_tacacs_log.py
# */1 * * * * sleep 40 && /usr/bin/python3 /root/sls/sls_tacacs_log.py
# */1 * * * * sleep 50 && /usr/bin/python3 /root/sls/sls_tacacs_log.py
```

初期考虑是每10秒运行一次 sls_tacacs.log.py，可以按照下述sleep语法配置。
```
# */1 * * * * sleep 10 && /usr/bin/python3 /root/sls/sls_tacacs_log.py
```

如果只需要以分钟为最小单位来周期性执行程序，可以按照下述语法配置。
```
*/1 * * * * /usr/bin/python3 /root/sls/sls_tacacs_log.py >> /root/sls/sls_tacacs_log.log 2>&1
```

### 保存生效
加载任务，使之生效：crontab /etc/crontab

查看任务：crontab -l，回显的内容和在crontab -e配置的一致
