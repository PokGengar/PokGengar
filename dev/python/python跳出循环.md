Python 跳出循环有 2 种方法，continue 和 break

break 是终止循环；continue 是跳出本次循环，继续后续匹配条件的循环动作。

```python
for i in range(1,5):
    print(i)

print("================")

for i in range(1,5):
    if i == 3:
        break
    else:
        print(i)

print("================")

for i in range(1,5):
    if i == 3:
        continue
    else:
        print(i)
```

运行代码结果如下：
```
/usr/bin/python3 /Users/xuanji/Desktop/devops/test.py
1
2
3
4
================
1
2
================
1
2
4
```
