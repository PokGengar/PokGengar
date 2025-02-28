#!/usr/bin/env python3
import sys
import base64
from openai import OpenAI

def decode_base64(encoded_str):
    return base64.b64decode(encoded_str).decode('utf-8')

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 deepseek_chat.py <system_role> <user_input>")
        sys.exit(1)

    # 解码 Base64 输入
    system_role = decode_base64(sys.argv[1])
    user_input = decode_base64(sys.argv[2])

    # 初始化 OpenAI 客户端
    client = OpenAI(
        api_key="sk-170c9a196bac462dbf5a432f8d1ebead",
        base_url="https://api.deepseek.com"
    )

    try:
        # 创建聊天完成
        response = client.chat.completions.create(
            model="deepseek-reasoner",
            messages=[
                {"role": "system", "content": system_role},
                {"role": "user", "content": user_input}
            ],
            stream=False
        )
        
        # 输出响应内容
        print(response.choices[0].message.content)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 
