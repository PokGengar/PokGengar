Python 将时间戳转换成 年月日时分秒，年月日时分秒之间使用的分隔符可自定义。

```python
import datetime
import time

print(time.time())

dt = datetime.datetime.fromtimestamp(time.time())

print(dt.strftime("%Y-%m-%d %H:%M:%S"))
print(dt.strftime("%Y:%m:%d %H-%M-%S"))
```
运行代码结果如下：
```
1736169603.14484
2025-01-06 21:20:03
2025:01:06 21-20-03
```
