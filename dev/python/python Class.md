编写类之前，应该先有一个框架，不同类的基础属性有哪些，哪个属性可以将不同的类关联在一起。

类的定义：使用 Class 关键字

类属性：所有实例共享的属性，如 school_name

构造函数：__init__方法用于初始化对象

实例属性：每个实例独有的属性，如 name, age 等

实例方法：对象可以调用的方法，如 add_score, get_average_score 等

特殊方法：如__str__用于定义对象的字符串表示

Python 提供了两个相关的字符串表示方法：
- __str__: 面向用户的字符串表示
- __repr__: 面向开发者的字符串表示
  
有几点重要说明：
- __str__和__repr__的名字是固定的，不能改变
- 如果只定义了__repr__而没有定义__str__，Python会使用__repr__的结果作为str()的返回值
- 这两个方法都必须返回字符串
- __str__: 当使用print(对象)或str(对象)时调用
- __repr__: 当在Python交互式环境中直接输入对象名，或使用repr(对象)时调用

最佳实践是：
- __str__返回简洁易读的字符串
- __repr__返回包含更多技术细节的字符串，通常包含重新创建该对象所需的信息

```
class Student:
    # 定义学生的基础信息，如姓名、年龄、学号
    def __init__(self, name, age, student_id):
        self.name = name
        self.age = age
        self.student_id = student_id
        # 使用字典来存储不同课程的分数
        self.course_scores = {}  # {课程名称: [分数列表]}

    def add_score(self, course_name, score):
        if course_name not in self.course_scores:
            self.course_scores[course_name] = []
        self.course_scores[course_name].append(score)

    def get_average_score(self, course_name):
        if course_name not in self.course_scores or not self.course_scores[course_name]:
            return 0
        scores = self.course_scores[course_name]
        return sum(scores) / len(scores)

    def __str__(self):
        return f"学生: {self.name}, 年龄: {self.age}, 学号: {self.student_id}"

class Course:
    # 定义课程的基础信息，如课程名称、教课老师
    def __init__(self, name, teacher):
        self.name = name
        self.teacher = teacher
        self.students = []

    def add_student(self, student):
        self.students.append(student)

    def get_average_score(self):
        if not self.students:
            return 0
        # 现在获取的是学生在本课程的平均分
        # 这里使用的 self.name 是在类Course 中定义的，在类Student 中对应的是 course_name
        total_score = sum(student.get_average_score(self.name) for student in self.students)
        return total_score / len(self.students)

    def __str__(self):
        return f"课程: {self.name}, 教师: {self.teacher}"

# 使用示例
if __name__ == "__main__":
    # 创建学生实例
    student1 = Student("小明", 18, "2024001")
    student2 = Student("小红", 19, "2024002")

    # 创建课程实例
    python_course = Course("Python基础", "张三")
    math_course = Course("数据结构", "李四")

    # 添加学生到课程
    python_course.add_student(student1)
    python_course.add_student(student2)
    math_course.add_student(student1)
    math_course.add_student(student2)

    # 添加不同课程的分数
    student1.add_score("Python基础", 90)
    student1.add_score("数据结构", 78)

    student2.add_score("Python基础", 95)
    student2.add_score("数据结构", 88)

    # 打印课程信息和平均分
    print(python_course)
    print(f"Python课程平均分: {python_course.get_average_score()}")
    print(math_course)
    print(f"数据结构课程平均分: {math_course.get_average_score()}")

    # 打印学生在各课程的平均分
    print(f"\n{student1}")
    print(f"Python基础平均分: {student1.get_average_score('Python基础')}")
    print(f"数据结构平均分: {student1.get_average_score('数据结构')}")

    print(f"\n{student2}")
    print(f"Python基础平均分: {student2.get_average_score('Python基础')}")
    print(f"数据结构平均分: {student2.get_average_score('数据结构')}")
```
