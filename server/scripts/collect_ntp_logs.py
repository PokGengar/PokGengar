#!/usr/bin/env python3
import paramiko
import mysql.connector
import time
from datetime import datetime
import re
import os
from dotenv import load_dotenv
import sys

# 加载环境变量
load_dotenv()

def connect_to_db():
    print(f"[{datetime.now()}] 正在连接数据库...")
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', '30.118.110.15'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', 'root'),
        database=os.getenv('DB_NAME', 'netdevops')
    )

def get_ntp_servers(db):
    print(f"[{datetime.now()}] 正在获取 NTP 服务器列表...")
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT ip, username, password 
        FROM servers 
        WHERE ip IN ('30.116.0.30', '30.116.1.30')
    """)
    servers = cursor.fetchall()
    print(f"[{datetime.now()}] 找到 {len(servers)} 台 NTP 服务器")
    cursor.close()
    return servers

def collect_logs_from_server(server):
    print(f"[{datetime.now()}] 正在从服务器 {server['ip']} 收集日志...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"[{datetime.now()}] 正在连接到服务器 {server['ip']}...")
        ssh.connect(
            hostname=server['ip'],
            username=server['username'],
            password=server['password'],
            timeout=10
        )
        print(f"[{datetime.now()}] 成功连接到服务器 {server['ip']}")
        
        # 读取日志文件
        print(f"[{datetime.now()}] 正在读取日志文件...")
        stdin, stdout, stderr = ssh.exec_command('cat /var/log/chrony/tracking.log')
        log_content = stdout.read().decode('utf-8')
        error_content = stderr.read().decode('utf-8')
        
        if error_content:
            print(f"[{datetime.now()}] 读取日志时发生错误: {error_content}")
            return []
            
        print(f"[{datetime.now()}] 成功读取日志文件，开始解析...")
        
        # 解析日志内容
        logs = []
        for line in log_content.split('\n'):
            if line and not line.startswith('=') and not 'Date (UTC)' in line:
                parts = line.split()
                if len(parts) >= 7:  # 确保有足够的字段
                    try:
                        date_time = f"{parts[0]} {parts[1]}"
                        ip_address = parts[2]
                        offset = float(parts[5])  # 科学计数法转换为浮点数
                        root_delay = float(parts[10])  # 科学计数法转换为浮点数
                        
                        logs.append({
                            'date_time': date_time,
                            'ip_address': ip_address,
                            'offset': offset,
                            'root_delay': root_delay
                        })
                    except (ValueError, IndexError) as e:
                        print(f"[{datetime.now()}] 解析行失败: {line}, 错误: {str(e)}")
                        continue
        
        print(f"[{datetime.now()}] 从服务器 {server['ip']} 解析到 {len(logs)} 条日志记录")
        return logs
    
    except Exception as e:
        print(f"[{datetime.now()}] 从服务器 {server['ip']} 收集日志失败: {str(e)}")
        return []
    
    finally:
        ssh.close()

def save_logs_to_db(db, logs):
    if not logs:
        print(f"[{datetime.now()}] 没有新的日志需要保存")
        return
    
    print(f"[{datetime.now()}] 正在保存 {len(logs)} 条日志记录到数据库...")
    cursor = db.cursor()
    insert_query = """
        INSERT INTO ntp_log (date_time, ip_address, `offset`, root_delay)
        VALUES (%s, %s, %s, %s)
    """
    
    try:
        for log in logs:
            cursor.execute(insert_query, (
                log['date_time'],
                log['ip_address'],
                log['offset'],
                log['root_delay']
            ))
        
        db.commit()
        print(f"[{datetime.now()}] 成功保存日志到数据库")
    except Exception as e:
        print(f"[{datetime.now()}] 保存日志到数据库失败: {str(e)}")
        db.rollback()
    finally:
        cursor.close()

def main():
    print(f"[{datetime.now()}] NTP 日志收集脚本启动...")
    while True:
        try:
            db = connect_to_db()
            servers = get_ntp_servers(db)
            
            for server in servers:
                logs = collect_logs_from_server(server)
                save_logs_to_db(db, logs)
            
            print(f"[{datetime.now()}] 完成一轮日志收集")
            
        except Exception as e:
            print(f"[{datetime.now()}] 错误: {str(e)}")
        
        finally:
            if 'db' in locals():
                db.close()
        
        print(f"[{datetime.now()}] 等待下一轮收集...")
        # 等待1分钟
        time.sleep(60)

if __name__ == "__main__":
    main() 
