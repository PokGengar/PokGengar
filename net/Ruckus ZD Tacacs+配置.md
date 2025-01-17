Tacasa+ 服务器配置中有一部分内容是：
```
service = exec {
                priv-lvl = 15
        }
```
关于 service 的配置可以在用户和组进行配置，运维人员在与 Tacacs+ 服务器进行认证的网络设备上操作时，网络设备需要能够识别到 service 字段的值，如上例子即 exec。

Ruckus ZD 对该字段的值有要求，必须是 zd-login。

参考链接：https://support.ruckuswireless.com/articles/000003050

需要注意的细节：
● service 必须是 zd-login；
● CLI配置：tacplus-service zd-login；
![image](https://github.com/user-attachments/assets/574090fc-e618-408c-9212-d375c6fc9b2b)
