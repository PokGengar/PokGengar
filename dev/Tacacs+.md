### 安装Tacacs+服务
以在 Centos7 部署 Tacacs+ 服务举例。

### Tacacs+配置
```
accounting file = /var/log/tac.acct
# authentication users not appearing elsewhere via
# the file /etc/passwd
# default authentication = file /etc/passwd

acl = default   {
                # permit = 192\.168\.0\.
                # permit = 192\.168\.2\.1
                permit = ^
}

# Example of host-specific configuration:
host = 192.168.2.1 {
        prompt = "Enter your Unix username and password, Username: "
        # Enable password for the router, generate a new one with tac_pwd
}

key = "<网络设备和Tacacs+服务器认证的密钥>"

group = guest {
        default service = permit
        acl = default
        cmd = system-view { deny .* }
        cmd = configure { deny .* }
        cmd = save { deny .* }
}

user = readonly {
        login = cleartext <明文密钥>
        pap = cleartext <明文密钥>
        member = guest
        name = 'readonly'
}
```
### 记账日志
当 Tacacs+ 服务器部署在公网，记账日志中只能看到网络设备的出口IP。

当 Tacacs+ 服务器部署在内网，记账日志中可以看到网络设备的管理IP。
```
[root@iZ2ze3oazim9phqh31s6e2Z ~]# tail -f /var/log/tac.acct 
Jan 17 15:25:30 <公网IP>   <AAA账号>       tty2    <运维人员IP> stop    task_id=26      <时区>    service=shell   priv-lvl=<授权级别>       cmd=<运维人员执行命令>
```
