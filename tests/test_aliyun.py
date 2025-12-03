#!/usr/bin/env python3
"""测试阿里云电商图片翻译 API"""

import os
import requests
from dotenv import load_dotenv
from alibabacloud_alimt20181012.client import Client
from alibabacloud_alimt20181012 import models
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_tea_util import models as util_models

load_dotenv()
ACCESS_KEY_ID = os.getenv("ALI_ACCESS_KEY_ID")
ACCESS_KEY_SECRET = os.getenv("ALI_ACCESS_KEY_SECRET")

IMAGE_URL = "https://m.media-amazon.com/images/I/71sN6-oFpHL._SL1500_.jpg"

def create_client():
    config = open_api_models.Config(
        access_key_id=ACCESS_KEY_ID,
        access_key_secret=ACCESS_KEY_SECRET
    )
    config.endpoint = "mt.cn-hangzhou.aliyuncs.com"
    return Client(config)

def translate_image():
    client = create_client()
    
    request = models.TranslateImageRequest(
        source_language="en",
        target_language="zh",
        image_url=IMAGE_URL,
        field="e-commerce",
        ext='{"needEditorData": "true"}'
    )
    
    runtime = util_models.RuntimeOptions(
        read_timeout=60000,
        connect_timeout=30000
    )
    
    print("正在调用阿里云电商图片翻译 API...")
    response = client.translate_image_with_options(request, runtime)
    
    code = response.body.code
    data = response.body.data
    print(f"状态码: {code}, 类型: {type(code)}")
    print(f"Data: {data}")
    print(f"code == 200: {code == 200}")
    print(f"bool(data): {bool(data)}")
    
    if str(code) == "200" and data:
        data = response.body.data
        print(f"Data type: {type(data)}")
        print(f"Data dir: {[x for x in dir(data) if not x.startswith('_')]}")
        
        # 检查编辑器数据
        if hasattr(data, 'template_json') and data.template_json:
            print(f"\n=== 编辑器数据 ===")
            print(data.template_json[:2000] if len(str(data.template_json)) > 2000 else data.template_json)
        if hasattr(data, 'in_painting_url') and data.in_painting_url:
            print(f"\n=== 擦除背景图 URL ===")
            print(data.in_painting_url)
        
        # 尝试多种访问方式
        final_url = None
        if hasattr(data, 'final_image_url') and data.final_image_url:
            final_url = data.final_image_url
        elif hasattr(data, 'FinalImageUrl') and data.FinalImageUrl:
            final_url = data.FinalImageUrl
        elif isinstance(data, dict):
            final_url = data.get('FinalImageUrl')
        
        print(f"翻译成功！结果图片 URL: {final_url}")
        
        if final_url:
            # 下载结果图片
            print("正在下载结果图片...")
            img_response = requests.get(final_url, timeout=30)
            
            output_path = "/Users/apple/Desktop/picturetranslate/test_result.jpg"
            with open(output_path, "wb") as f:
                f.write(img_response.content)
            
            print(f"结果已保存到: {output_path}")
            return output_path
        else:
            print("未获取到结果图片 URL")
            return None
    else:
        print(f"翻译失败: {response.body.message}")
        return None

if __name__ == "__main__":
    translate_image()
