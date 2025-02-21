#!/usr/bin/env python3
import paramiko
import threading
import queue
import json
import sys
import time
from datetime import datetime
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SSHExecutor:
    def __init__(self, devices: List[Dict], max_retries: int = 3):
        self.devices = devices
        self.max_retries = max_retries
        self.results_queue = queue.Queue()
        self.threads: List[threading.Thread] = []

    def execute_command(self, device: Dict, commands: str) -> Dict:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        result = {
            'host': device['host'],
            'success': False,
            'output': '',
            'error': '',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        for attempt in range(self.max_retries):
            try:
                # 设置更多的连接参数
                client.connect(
                    hostname=device['host'],
                    username=device['username'],
                    password=device['password'],
                    timeout=30,
                    banner_timeout=60,
                    auth_timeout=60,
                    allow_agent=False,
                    look_for_keys=False
                )

                # 等待连接稳定
                time.sleep(1)

                # 创建交互式shell会话
                channel = client.invoke_shell()
                channel.settimeout(30)

                # 分割多行命令
                command_list = commands.strip().split('\n')
                output = []
                
                # 执行每个命令并等待输出
                for cmd in command_list:
                    cmd = cmd.strip()
                    if not cmd:
                        continue
                        
                    # 发送命令
                    channel.send(cmd + '\n')
                    time.sleep(2)  # 等待命令执行
                    
                    # 读取输出直到没有更多数据
                    while channel.recv_ready():
                        chunk = channel.recv(4096)
                        output.append(chunk.decode('utf-8'))
                        time.sleep(0.1)

                # 合并所有输出
                result['output'] = ''.join(output)
                result['success'] = True
                break

            except Exception as e:
                result['error'] = f'尝试 {attempt + 1}/{self.max_retries}: {str(e)}'
                logger.error(f"Error executing commands on {device['host']} (attempt {attempt + 1}): {e}")
                
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                
            finally:
                try:
                    client.close()
                except:
                    pass

        self.results_queue.put(result)

    def execute_parallel(self, commands: str) -> List[Dict]:
        for device in self.devices:
            thread = threading.Thread(
                target=self.execute_command,
                args=(device, commands)
            )
            thread.start()
            self.threads.append(thread)

        for thread in self.threads:
            thread.join()

        results = []
        while not self.results_queue.empty():
            results.append(self.results_queue.get())

        return results

def main():
    if len(sys.argv) < 3:
        print("Usage: ssh_executor.py <devices_json> <commands>")
        sys.exit(1)

    try:
        devices = json.loads(sys.argv[1])
        commands = sys.argv[2]

        logger.info(f"开始执行命令:\n{commands}")
        logger.info(f"设备列表: {json.dumps(devices, ensure_ascii=False)}")

        executor = SSHExecutor(devices)
        results = executor.execute_parallel(commands)
        
        logger.info(f"执行结果: {json.dumps(results, ensure_ascii=False)}")
        print(json.dumps(results))

    except Exception as e:
        logger.error(f"执行过程中发生错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
