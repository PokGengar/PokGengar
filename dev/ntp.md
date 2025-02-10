Linux系统：Debian 12.9 64

#### 安装 chrony
sudo apt update
```
Get:1 http://mirrors.cloud.aliyuncs.com/debian bookworm InRelease [151 kB]
Get:2 http://mirrors.cloud.aliyuncs.com/debian-security bookworm-security InRelease [48.0 kB]
Get:3 http://mirrors.cloud.aliyuncs.com/debian bookworm-updates InRelease [55.4 kB]
Get:4 http://mirrors.cloud.aliyuncs.com/debian bookworm-backports InRelease [59.0 kB]
Get:5 http://mirrors.cloud.aliyuncs.com/debian bookworm/main Sources [9,496 kB]
Get:6 http://mirrors.cloud.aliyuncs.com/debian bookworm/main amd64 Packages [8,792 kB]
Get:7 http://mirrors.cloud.aliyuncs.com/debian bookworm/main Translation-en [6,109 kB]
Get:8 http://mirrors.cloud.aliyuncs.com/debian bookworm/main amd64 DEP-11 Metadata [4,492 kB]
Get:9 http://mirrors.cloud.aliyuncs.com/debian-security bookworm-security/main Sources [140 kB]
Get:10 http://mirrors.cloud.aliyuncs.com/debian-security bookworm-security/main amd64 Packages [243 kB]
Get:11 http://mirrors.cloud.aliyuncs.com/debian-security bookworm-security/main Translation-en [144 kB]
Get:12 http://mirrors.cloud.aliyuncs.com/debian bookworm-updates/main Sources [16.2 kB]
Get:13 http://mirrors.cloud.aliyuncs.com/debian bookworm-updates/main amd64 Packages [13.5 kB]
Get:14 http://mirrors.cloud.aliyuncs.com/debian bookworm-updates/main Translation-en [16.0 kB]
Get:15 http://mirrors.cloud.aliyuncs.com/debian bookworm-backports/main Sources [321 kB]
Get:16 http://mirrors.cloud.aliyuncs.com/debian bookworm-backports/main amd64 Packages [282 kB]
Get:17 http://mirrors.cloud.aliyuncs.com/debian bookworm-backports/main Translation-en [235 kB]
Fetched 30.6 MB in 5s (6,632 kB/s)                              
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
5 packages can be upgraded. Run 'apt list --upgradable' to see them.
```
sudo apt install chrony -y
```
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
chrony is already the newest version (4.3-2+deb12u1).
0 upgraded, 0 newly installed, 0 to remove and 5 not upgraded.
```
#### 配置文件
主NTP服务器：/etc/chrony/chrony.conf
```
# Use Alibaba NTP server
# Public NTP
# Alicloud NTP

# === 上游时间源 ===
# 阿里云内网 NTP
server ntp.cloud.aliyuncs.com minpoll 4 maxpoll 10 iburst prefer
# 阿里云公网 NTP
server ntp1.aliyun.com minpoll 4 maxpoll 10 iburst
server ntp2.aliyun.com minpoll 4 maxpoll 10 iburst

# Ignore stratum in source selection.
stratumweight 0.05

# Enable kernel RTC synchronization.
rtcsync

# In first three updates step the system clock instead of slew
# if the adjustment is larger than 10 seconds.
makestep 10 3

# 设置时区数据库路径
leapsectz right/UTC

# Allow NTP client access from local network.
# 允许的客户端网段
allow <client ip subnet>
allow <ntp peer ip subnet>

# 设置本地层级
local stratum 8

# 允许备用服务器作为对等体
peer <slave ntp server ip> iburst prefer

# Listen for commands only on localhost.
bindcmdaddress 127.0.0.1
bindcmdaddress ::1

# Disable logging of client accesses.
# === 安全设置 ===
# 禁止客户端修改服务器时间
# noclientlog

# Send a message to syslog if a clock adjustment is larger than 0.5 seconds.
logchange 0.5

# === 基本配置 ===
# Record the rate at which the system clock gains/losses time
driftfile /var/lib/chrony/chrony.drift
logdir /var/log/chrony
log measurements statistics tracking

# NTP响应速率限制
ratelimit interval 3 burst 8
```
备NTP服务器：：/etc/chrony/chrony.conf
```
# Use Alibaba NTP server
# Public NTP
# Alicloud NTP

# === 上游时间源 ===
# 阿里云内网 NTP
server ntp.cloud.aliyuncs.com minpoll 4 maxpoll 10 iburst prefer
# 阿里云公网 NTP
server ntp1.aliyun.com minpoll 4 maxpoll 10 iburst
server ntp2.aliyun.com minpoll 4 maxpoll 10 iburst

# Ignore stratum in source selection.
stratumweight 0.05

# Enable kernel RTC synchronization.
rtcsync

# In first three updates step the system clock instead of slew
# if the adjustment is larger than 10 seconds.
makestep 10 3

# 设置时区数据库路径
leapsectz right/UTC

# Allow NTP client access from local network.
# 允许的客户端网段
allow <client ip subnet>
allow <ntp peer ip subnet>

# 设置本地层级
local stratum 9

# 允许主用服务器作为对等体
peer <master ntp server ip> iburst prefer

# Listen for commands only on localhost.
bindcmdaddress 127.0.0.1
bindcmdaddress ::1

# Disable logging of client accesses.
# === 安全设置 ===
# 禁止客户端修改服务器时间
# noclientlog

# Send a message to syslog if a clock adjustment is larger than 0.5 seconds.
logchange 0.5

# === 基本配置 ===
# Record the rate at which the system clock gains/losses time
driftfile /var/lib/chrony/chrony.drift
logdir /var/log/chrony
log measurements statistics tracking

# NTP响应速率限制
ratelimit interval 3 burst 8
```

开启 noclientlog 报错：
```
systemctl status chrony
× chrony.service - chrony, an NTP client/server
     Loaded: loaded (/lib/systemd/system/chrony.service; enabled; preset: enabled)
     Active: failed (Result: exit-code) since Thu 2025-02-06 16:25:47 CST; 17s ago
   Duration: 14min 49.296s
       Docs: man:chronyd(8)
             man:chronyc(1)
             man:chrony.conf(5)
    Process: 1724 ExecStart=/usr/sbin/chronyd $DAEMON_OPTS (code=exited, status=1/FAILURE)
        CPU: 27ms

Feb 06 16:25:47 iZbp173oxsaeu8pd5nr0hvZ systemd[1]: Starting chrony.service - chrony, an NTP client/server...
Feb 06 16:25:47 iZbp173oxsaeu8pd5nr0hvZ chronyd[1727]: chronyd version 4.3 starting (+CMDMON +NTP +REFCLOCK +RTC +PRIVDROP +SCFILTER +SIGND +ASYNCDNS +NTS +SECHASH +IPV6 -DEBUG)
Feb 06 16:25:47 iZbp173oxsaeu8pd5nr0hvZ chronyd[1727]: Frequency -35.433 +/- 2.311 ppm read from /var/lib/chrony/chrony.drift
Feb 06 16:25:47 iZbp173oxsaeu8pd5nr0hvZ chronyd[1727]: Fatal error : Rate limiting cannot be enabled with noclientlog
Feb 06 16:25:47 iZbp173oxsaeu8pd5nr0hvZ chronyd[1724]: Rate limiting cannot be enabled with noclientlog
Feb 06 16:25:47 iZbp173oxsaeu8pd5nr0hvZ systemd[1]: chrony.service: Control process exited, code=exited, status=1/FAILURE
Feb 06 16:25:47 iZbp173oxsaeu8pd5nr0hvZ systemd[1]: chrony.service: Failed with result 'exit-code'.
Feb 06 16:25:47 iZbp173oxsaeu8pd5nr0hvZ systemd[1]: Failed to start chrony.service - chrony, an NTP client/server.
```
#### 检查 chrony 状态
systemctl status chrony.service 
```
● chrony.service - chrony, an NTP client/server
     Loaded: loaded (/lib/systemd/system/chrony.service; enabled; preset: enabled)
     Active: active (running) since Thu 2025-02-06 16:27:07 CST; 7s ago
       Docs: man:chronyd(8)
             man:chronyc(1)
             man:chrony.conf(5)
    Process: 1852 ExecStart=/usr/sbin/chronyd $DAEMON_OPTS (code=exited, status=0/SUCCESS)
   Main PID: 1854 (chronyd)
      Tasks: 2 (limit: 2004)
     Memory: 1.3M
        CPU: 39ms
     CGroup: /system.slice/chrony.service
             ├─1854 /usr/sbin/chronyd -F 1
             └─1855 /usr/sbin/chronyd -F 1

Feb 06 16:27:07 iZbp173oxsaeu8pd5nr0hvZ systemd[1]: Starting chrony.service - chrony, an NTP client/server...
Feb 06 16:27:07 iZbp173oxsaeu8pd5nr0hvZ chronyd[1854]: chronyd version 4.3 starting (+CMDMON +NTP +REFCLOCK +RTC +PRIVDROP +SCFILTER +SIGND +ASYNCDNS +NTS +SECHASH +IPV6 -DEBUG)
Feb 06 16:27:07 iZbp173oxsaeu8pd5nr0hvZ chronyd[1854]: Frequency -35.433 +/- 2.311 ppm read from /var/lib/chrony/chrony.drift
Feb 06 16:27:07 iZbp173oxsaeu8pd5nr0hvZ chronyd[1854]: Loaded seccomp filter (level 1)
Feb 06 16:27:07 iZbp173oxsaeu8pd5nr0hvZ systemd[1]: Started chrony.service - chrony, an NTP client/server.
Feb 06 16:27:13 iZbp173oxsaeu8pd5nr0hvZ chronyd[1854]: Selected source 100.100.61.88 (ntp.cloud.aliyuncs.com)
```
#### 设置NTP服务器时区
/etc/default/locale
```
LANG=zh_CN.UTF-8
LC_TIME=zh_CN.UTF-8
```
安装中文语言包

apt-get install locales
locale-gen zh_CN.UTF-8

重新登陆服务器后，查询时间
date
```
Thu Feb  6 17:33:14 CST 2025
```

timedatectl status
```
               Local time: Thu 2025-02-06 17:33:59 CST
           Universal time: Thu 2025-02-06 09:33:59 UTC
                 RTC time: Thu 2025-02-06 09:33:59
                Time zone: Asia/Shanghai (CST, +0800)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
```
#### 网络设备配置NTP服务器
ntp server 192.168.0.30 source Loopback 0 prefer

ntp server 192.168.1.30 source Loopback 0
#### NTP服务器检查状态
chronyc sources -v：检查上游服务器状态（合并展示主备NTP服务器的结果）
```
  .-- Source mode  '^' = server, '=' = peer, '#' = local clock.
 / .- Source state '*' = current best, '+' = combined, '-' = not combined,
| /             'x' = may be in error, '~' = too variable, '?' = unusable.
||                                                 .- xxxx [ yyyy ] +/- zzzz
||      Reachability register (octal) -.           |  xxxx = adjusted offset,
||      Log2(Polling interval) --.      |          |  yyyy = measured offset,
||                                \     |          |  zzzz = estimated error.
||                                 |    |           \
MS Name/IP address         Stratum Poll Reach LastRx Last sample               
===============================================================================
^* 100.100.61.88                 1   6   377    58    -19us[-8866ns] +/-   11ms
^? 120.25.115.20                 0   7     0     -     +0ns[   +0ns] +/-    0ns
^? 203.107.6.88                  0   7     0     -     +0ns[   +0ns] +/-    0ns
=+ 10.116.1.30                   2   6   377    69    +70us[  +70us] +/-   11ms

  .-- Source mode  '^' = server, '=' = peer, '#' = local clock.
 / .- Source state '*' = current best, '+' = combined, '-' = not combined,
| /             'x' = may be in error, '~' = too variable, '?' = unusable.
||                                                 .- xxxx [ yyyy ] +/- zzzz
||      Reachability register (octal) -.           |  xxxx = adjusted offset,
||      Log2(Polling interval) --.      |          |  yyyy = measured offset,
||                                \     |          |  zzzz = estimated error.
||                                 |    |           \
MS Name/IP address         Stratum Poll Reach LastRx Last sample               
===============================================================================
^* 100.100.61.88                 1   6   377    15    +92us[-3285ns] +/-   11ms
^? 120.25.115.20                 0   7     0     -     +0ns[   +0ns] +/-    0ns
^? 203.107.6.88                  0   7     0     -     +0ns[   +0ns] +/-    0ns
=+ 10.116.0.30                   2   6   177    45    -36us[ -116us] +/-   11ms
```

参数说明
__第一列 (MS)：__
- ^：服务器
- =：对等体
- #：本地时钟
- *：当前选中的最佳时间源
- ?：不可用的源

__Name/IP address：__
- 时间源的主机名或IP地址

__Stratum：__
- 时间源的层级（0-16）：1 表示直接连接到原子钟或GPS的服务器，0 表示不可用

__Poll：__
- 轮询间隔（以2的幂表示）：10 表示 2^10 = 1024秒，9 表示 2^9 = 512秒

__Reach：__
- 可达性寄存器（八进制）：377 表示最近8次轮询全部成功，0 表示完全不可达

__LastRx：__
- 上次接收数据的时间：649 表示649秒前，- 表示从未接收到数据

__Last sample：__
- -44us 实际时间偏移，[-57us] 测量时的偏移，+/- 11ms 估计误差范围

chronyc clients：检查客户端状态
```
Hostname                      NTP   Drop Int IntL Last     Cmd   Drop Int  Last
===============================================================================
10.x.x.x                    2      0   6   -    17       0      0   -     -
```
参数说明：
__NTP请求部分（左侧）：__
- Hostname: 客户端的IP地址（10.118.9.235）
- NTP: 从该客户端收到的NTP请求数量（2个请求）
- Drop: 丢弃的请求数量（0个丢弃）
- Int: 客户端的轮询间隔（6表示64秒）
- IntL: 客户端的最后轮询间隔（-表示未设置）
- Last: 自上次请求以来的秒数（17秒前）

__命令请求部分（右侧）：__
- Cmd: 从该客户端收到的命令数（0个命令）
- Drop: 丢弃的命令数（0个丢弃）
- Int: 命令的轮询间隔（-表示未设置）
- Last: 上次命令请求后的秒数（-表示未收到命令）

__重要说明：__
- Int 值6表示轮询间隔为2^6=64秒
- 这表明有一个客户端（10.x.x.x）正在正常同步时间
- 没有任何请求被丢弃，表示连接状况良好
- 该客户端只进行NTP同步，没有发送任何命令请求

#### 网络设备检查状态
show ntp server
```
ntp-server                                source    keyid        prefer  version  status     
----------------------------------------  --------  -----------  ------  -------  -----------
192.168.1.30                               Lo0       None         FALSE   4        reject       
192.168.0.30                               Lo0       None         TRUE    4        select       
```

show ntp status 
```
Clock is synchronized, stratum 3, reference is 192.168.0.30
nominal freq is 250.000 Hz, actual freq is 250.000 Hz, precision is 2**19
reference time is EB4FF42E.F6A01F88 (02:53:34.000 UTC Fri, Feb 7, 2025)
clock offset is -0.00016 sec, root delay is 0.00742 sec
root dispersion is 0.01616 msec, peer dispersion is 0.00404 msec
system poll interval is 64, last update was 51 sec ago
system time(GMT) is EB4FF463.176A24DF (02:54:27.000 GMT Fri, Feb 7, 2025)
```
参数说明：
- 同步状态
  - synchronized: 表示时钟已同步
  - stratum 3: 本设备的层级（上游服务器应该是stratum 2）
  - reference: 当前参考时间源的IP地址
- 频率信息
  - nominal freq: 标称频率（理论值）
  - actual freq: 实际频率（当前值）
  - precision: 时钟精度（2的19次方分之一秒）
- 参考时间
  - 最后一次从参考源接收到时间的时间戳
  - 包括16进制值和人类可读格式
- 偏移和延迟
  - clock offset: 本地时钟与参考时钟的时间差（-0.22毫秒）
  - root delay: 到主参考时钟的往返延迟（7.21毫秒）
- 色散值
  - root dispersion: 到主参考时钟的最大误差（0.01368毫秒）
  - peer dispersion: 与直接上游服务器的最大误差（0.00168毫秒）
- 轮询信息
  - poll interval: 轮询间隔（64秒）
  - last update: 距离上次更新的时间（48秒前）
- 系统时间
  - 当前系统时间的时间戳
  - 包括16进制值和人类可读格式

状态评估：
- 时钟同步状态良好（已同步）
- 时间偏移很小（-0.22ms）
- 延迟较低（7.21ms）
- 色散值较小，表示时间精度好
- 正常的轮询间隔（64秒）
- 最近有更新（48秒前）

这些参数表明该交换机的NTP服务运行状况良好，时间同步精确度高。

问题：reference time 和 system time 为什么不一致？

Reference Time（参考时间）：这是最后一次从NTP服务器成功同步时的时间戳，表示上一次成功获取参考时间的时刻。

System Time（系统时间）：这是显示命令时的当前系统时间，表示执行命令的实时时刻。
![image](https://github.com/user-attachments/assets/b57dd24e-82bf-4b8c-8c0b-60be8a80c775)
