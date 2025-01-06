![image](https://github.com/user-attachments/assets/f7b302a9-0453-4491-86c7-46119b3047c7)![image](https://github.com/user-attachments/assets/d7448f8f-d99a-4cfe-950f-efd69ecd9926)这里将介绍所有在 Python 中 with 使用方法。

### 读
#### .read()
一次性读取文件中的所有信息，类型是字符串。
```python
with open('sls_log', 'r') as file:
    re = file.read()
    print(re)
    print(type(re))
```
运行代码结果如下：
```
david
jone
tom
leo
<class 'str'>
```

#### .readlines()
逐行读取文件中的信息，类型是列表。
```python
with open('sls_log', 'r') as file:
    re = file.readlines()
    print(re)
    print(type(re))
```
运行代码结果如下：
```
['david\n', 'jone\n', 'tom\n', 'leo']
<class 'list'>
```

#### .readline()
只读取文件中的第一行信息，类型是字符串。
```python
with open('sls_log', 'r') as file:
    re = file.readline()
    print(re)
    print(type(re))
```
运行代码结果如下：
```
david

<class 'str'>
```

#### .readable()
判断指定文件是不是一个具有可读性的文件。
```python
with open('sls_log', 'r') as file:
    re = file.readable()
    print(re)
    print(type(re))
```
运行代码结果如下：
```
True
<class 'bool'>
```

### 写
#### .write()
以覆盖原始文件的写入方式，且只能写入字符串格式的参数，如果类型是非字符串，则会报错。
```python
with open('sls_log', 'w') as file:
    file.write('Hello World!\nwww.baidu.com\n')
```
运行代码结果如下：

![image](https://github.com/user-attachments/assets/171fefd7-0865-4b01-8440-c1b7c8aaca4b)

```
with open('sls_log', 'w') as file:
    file.write(['Hello World!','www.google.com'])
```
运行代码结果如下：
```
Traceback (most recent call last):
    file.write(['Hello World!','www.google.com'])
TypeError: write() argument must be str, not list
```

#### .writelines()
以覆盖原始文件的写入方式，但可以写入字符串、列表等类型的字段。
```python
with open('sls_log', 'w') as file:
    file.writelines('Hello World!\nwww.baidu.com\n')
```
运行代码结果如下：

![image](https://github.com/user-attachments/assets/c2d08b80-d088-48b5-8bf9-effdd0d690ef)

```python
with open('sls_log', 'w') as file:
    file.writelines(['Hello World!\n','www.google.com\n'])
```
运行代码结果如下：

![image](https://github.com/user-attachments/assets/bf34095f-23c3-40d9-9aeb-64cb6ea8ce03)

#### .writable()
判断指定文件是不是一个具有可写性的文件。
```python
with open('sls_log', 'w') as file:
    re = file.writable()
    print(re)
```
运行代码结果如下：
```
True
```

#### a
追加新增字段的写入方式，write() 和 writelines() 方式同上。
```python
with open('sls_log', 'a') as file:
    file.writelines(['Hello World!\n','www.google.com\n'])
```
运行代码结果如下：

![image](https://github.com/user-attachments/assets/ae22b3ba-78fe-4ece-8952-a8fa499c4739)
