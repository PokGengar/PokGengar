华为 Route-monitor-group（路由监控组）

### 为什么需要路由监控组
为了提高网络可靠性，现网中采用设备级冗余备份，即两台设备互为备份，以负载均衡的方式进行，当其中一台设备发生故障时，另一台设备可以接管故障设备的业务。当一台设备双归属到两台以主备方式运行的设备时，需要解决设备间链路可靠性和负载均衡问题。

在双机热备场景下，如果网络侧链路部分或全部发生故障，网络侧链路的带宽会相应减少，如果接入侧不能及时感知到链路故障，将造成网络拥塞或流量丢失。为了避免上述问题的发生，可以配置路由监控组，并将路由监控组的状态与 IPv4静态路由的状态关联，通过网络侧路由状态变化触发接入侧业务模块主备链路切换。

### 路由监控组的应用场景有哪些？
#### 防止网络拥塞
如下图所示，AGG_Switch_A和AGG_Switch_B互为备份，多台ACC_Switch双归接入到两台AGG_Switch，实现负载分担。如果AGG_Switch_A与核心网之间的某条网络侧链路发生故障，则两者之间链路的可用带宽会相应减少，但ACC_Switch无法感知链路故障，依然会将发往核心网的报文转发给AGG_Switch_A，导致AGG_Switch_A与核心网之间的链路出现拥塞。

为了避免网络拥塞，可以在ACC_Switch上部署路由监控组，快速检测网络IP路由的连通性，当IP路由状态发生变化时，ACC_Switch能够及时进行接入侧链路切换。

![image](https://github.com/user-attachments/assets/211d5150-75b6-4aca-8cdb-379956fa070b)

#### 防止流量丢失
如下图所示，AGG_Switch_A和AGG_Switch_B互为备份，多台ACC_Switch双归到两台AGG_Switch上，实现负载分担。如果AGG_Switch_A与核心网之间的链路全部故障，则网络侧只有AGG_Switch_B与核心网之间的链路可用，但ACC_Switch无法感知链路故障，仍会将发往核心网的报文转发给AGG_Switch_A。这种场景下，由于AGG_Switch_A与核心网之间的链路全部故障，从ACC_Switch发来的报文会丢失。

为了避免流量丢失，可以在ACC_Switch上配置路由监控组，快速检测网络IP路由的连通性，当IP路由状态发生变化时，ACC_Switch能够及时进行接入侧链路切换。

![image](https://github.com/user-attachments/assets/1896776a-6ee1-41c8-95a9-c04b7d9aa8ee)

### 路由监控组如何工作？
网络侧监控的同一类型的路由可以加入一个路由监控组，每个路由监控组用唯一名称标识，路由监控组的状态取决于其成员路由的状态，当路由监控组的状态发生变化时，业务模块会进行链路切换。

![image](https://github.com/user-attachments/assets/d9ece4b7-4a2d-440f-9b01-89e23397ccf1)

路由监控组工作流程

路由监控组可以监控所有成员路由的状态，同一组内监控路由之间的逻辑关系可以为“AND”或者“OR”。

当路由监控组中监控路由之间的逻辑关系设置为“AND”时，只要组中一条路由状态变为Down，整个路由监控组的状态就变为Down，路由管理模块RM（Route Management Module）会通知业务模块进行链路切换。

当设置路由监控组中监控路由之间的逻辑关系为“或”时，只有组内所有路由都Down，组状态才变为Down，RM模块才会通知业务模块进行链路切换。

### 路由监控组配置
```
ip route-monitor-group group-name

# 默认情况下，交换机没有创建路由监控组。
route monitor group

# 路由监控组中增加一条路由。
# 默认情况下，路由监控组中没有添加任何路由。
# 如需添加更多路由到路由监控组，请重复此步骤。路由监控组最多可监控16条路由。
track ip route [ vpn-instance vpn-instance-name ] dest-address { mask | mask-length }

# （可选）运行操作员和
# 路由监控组中的路由之间的关系设置为“与”。
# 默认情况下，路由监控组中路由的状态是“或”的关系，即只要组内有一条路由为Up，路由监控组的状态就为Up；只有组内所有路由都为Down，路由监控组的状态才为Down。

# 配置RM模块通知相关服务模块执行链路切换的延迟时间。
# 默认情况下，延迟为 0 秒。
（可选）trigger-down-delay delay-value

# 配置了 RM 模块指示相关服务模块执行链路切回的延迟时间。
# 默认情况下，延迟时间为 5 秒。
# （可选）trigger-up-delay delay-value

# 配置IPv4静态路由与路由监控组的联动。
# 执行命令ipv4静态路由与路由监控组的联动，配置IPv4静态路由与路由监控组的联动。
ip route-static ip-address { mask | mask-length } { nexthop-address | interface-type interface-number [ nexthop-address ] | vpn-instance vpn-instance-name nexthop-address } [ preference preference | tag tag ] track route-monitor-group route-monitor-group-name [ description text ]
```

参考文档：

https://info.support.huawei.com/info-finder/encyclopedia/en/Route+Monitoring+Group.html

https://support.huawei.com/enterprise/en/doc/EDOC1100410525/9fce58a4/configuring-association-between-ipv4-static-routes-and-a-route-monitoring-group#EN-US_CONCEPT_0192305424
