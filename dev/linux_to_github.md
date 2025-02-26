git init

git status  ：查看文件状态

git branch  ：查看分支

git checkout 分支名  ：如果需要切换分支

git config --global user.name "[github_project_name]"

git config --global user.email "[github_login_mail]"

git add server/  ：将文件添加到暂存区

git commit -m "update"  ：将暂存区的更改提交到本地仓库
```
[master faeaa7a7] update
 6 files changed, 393 insertions(+), 48 deletions(-)
```
git push https://[token]@github.com/[github_project_name]/[github_project_name].git  ：将本地仓库的更改推送到远程仓库
```
枚举对象: 35, 完成.
对象计数中: 100% (35/35), 完成.
使用 8 个线程进行压缩
压缩对象中: 100% (17/17), 完成.
写入对象中: 100% (18/18), 4.78 KiB | 2.39 MiB/s, 完成.
总共 18（差异 13），复用 0（差异 0），包复用 0
remote: Resolving deltas: 100% (13/13), completed with 13 local objects.
To https://github.com/[github_project_name]/[github_project_name].git
   sdad98.sadas87  master -> master
```
