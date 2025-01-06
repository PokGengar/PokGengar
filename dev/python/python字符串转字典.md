### 通过 json 实现
```python
import json

user_info = '{"name":"david", "age":"31", "gender":"male"}'
print(type(user_info))

user_dict = json.loads(user_info)
print(user_dict)
print(type(user_dict))
print(user_dict['name'])
```
运行代码结果如下：
```
<class 'str'>
{'name': 'david', 'age': '31', 'gender': 'male'}
<class 'dict'>
david
```
在 python 中通过 json 实现字符串转字典有一个缺陷，字符串中必须使用双引号 ""，如果使用单引号 ''，则报错，具体如下：
```python
import json

user_info = "{'name':'david', 'age':'31', 'gender':'male'}"
print(type(user_info))

user_dict = json.loads(user_info)
print(user_dict)
print(type(user_dict))
print(user_dict['name'])
```
运行代码结果如下：
```
<class 'str'>
json.decoder.JSONDecodeError: Expecting property name enclosed in double quotes: line 1 column 2 (char 1)
```
### 通过 ast.literal_eval

字符串中是双引号 ""
```python
import ast

user_info = '{"name":"david", "age":"31", "gender":"male"}'
print(type(user_info))

user_dict = ast.literal_eval(user_info)
print(user_dict)
print(type(user_dict))
print(user_dict['name'])
```
运行代码结果如下：
```
<class 'str'>
{'name': 'david', 'age': '31', 'gender': 'male'}
<class 'dict'>
david
```
字符串中是单引号 ''
```python
import ast

user_info = "{'name':'david', 'age':'31', 'gender':'male'}"
print(type(user_info))

user_dict = ast.literal_eval(user_info)
print(user_dict)
print(type(user_dict))
print(user_dict['name'])
```
运行代码结果如下：
```
<class 'str'>
{'name': 'david', 'age': '31', 'gender': 'male'}
<class 'dict'>
david
```
