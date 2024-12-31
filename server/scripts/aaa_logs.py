#!/usr/bin/env python3
import json
import os
import datetime
import time
import sys

LOG_FILE = '/root/sls/sls_log'

def get_file_size(file_path):
    try:
        return os.path.getsize(file_path)
    except OSError:
        return 0

def parse_log_line(line):
    try:
        data = json.loads(line.strip())
        return {
            "timestamp": data.get("Time", ""),
            "server_ip": data.get("WAN_IP", ""),
            "username": data.get("User", ""),
            "action": data.get("CMD", "")
        }
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing line: {str(e)}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        return None

def get_aaa_logs():
    logs = []
    try:
        # 检查文件是否存在
        if not os.path.exists(LOG_FILE):
            print(f"Log file not found: {LOG_FILE}", file=sys.stderr)
            return json.dumps([])

        # 获取文件大小
        file_size = get_file_size(LOG_FILE)
        if file_size == 0:
            print("Log file is empty", file=sys.stderr)
            return json.dumps([])

        # 读取文件内容
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            try:
                # 读取最后的1000行（可以根据需要调整）
                lines = f.readlines()
                if len(lines) > 1000:
                    lines = lines[-1000:]
                
                # 处理每一行
                for line in lines:
                    line = line.strip()
                    if not line:  # 跳过空行
                        continue
                        
                    log_entry = parse_log_line(line)
                    if log_entry:
                        logs.append(log_entry)
                    
            except Exception as e:
                print(f"Error reading lines: {str(e)}", file=sys.stderr)
                return json.dumps([])

        # 按时间戳倒序排序
        try:
            logs.sort(key=lambda x: x['timestamp'], reverse=True)
        except Exception as e:
            print(f"Error sorting logs: {str(e)}", file=sys.stderr)

        return json.dumps(logs, ensure_ascii=False)
    except Exception as e:
        print(f"Error processing log file: {str(e)}", file=sys.stderr)
        return json.dumps([])

def main():
    try:
        result = get_aaa_logs()
        print(result)
    except Exception as e:
        print(f"Fatal error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
