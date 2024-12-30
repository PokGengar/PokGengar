**重置 Ruckus ZD1200**

**重置的过程中，以参考官方文档为主，但仍有几个细节是官方中未提到的，需要注意**

https://docs.commscope.com/bundle/ZD-1200-QuickSetupGuide-RevD/resource/ZD-1200-QuickSetupGuide-RevD.pdf

需要注意的细节：
- 捅住 F/D 至少 15秒时间，最好 15秒 - 20秒；
- Win10系统以上，不支持使用浏览器 web 配置 Ruckus ZD1200；
- 使用 Putty SSH 192.168.0.2 的方式配置，按照配置向导一步步进行；
- Smart Redundancy 配置生效在完成 peer 和 secert 以后，exit 退出即可保存，再通过 smart redundancy 进入后执行 show，即可查看生效的配置；
