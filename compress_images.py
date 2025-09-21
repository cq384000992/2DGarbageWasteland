#!/usr/bin/env python3
"""
图片压缩脚本
使用PIL库压缩PNG图片，保持透明通道
"""

import os
from PIL import Image
import sys

def compress_image(input_path, output_path, quality=85, optimize=True):
    """
    压缩单张图片
    
    Args:
        input_path: 输入文件路径
        output_path: 输出文件路径  
        quality: 压缩质量 (1-100)
        optimize: 是否优化
    """
    try:
        # 打开图片
        with Image.open(input_path) as img:
            # 转换为RGBA模式以保持透明通道
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # 保存压缩后的图片
            img.save(output_path, 'PNG', optimize=optimize, compress_level=9)
            
            # 获取文件大小
            original_size = os.path.getsize(input_path)
            compressed_size = os.path.getsize(output_path)
            compression_ratio = (1 - compressed_size / original_size) * 100
            
            print(f"✅ {os.path.basename(input_path)}: {original_size/1024/1024:.2f}MB → {compressed_size/1024/1024:.2f}MB ({compression_ratio:.1f}% 压缩)")
            
            return True
            
    except Exception as e:
        print(f"❌ 压缩失败 {input_path}: {e}")
        return False

def main():
    """主函数"""
    src_dir = "src"
    backup_dir = "src_backup"
    
    # 检查src目录是否存在
    if not os.path.exists(src_dir):
        print(f"❌ 源目录 {src_dir} 不存在")
        return
    
    # 创建备份目录
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        print(f"📁 创建备份目录: {backup_dir}")
    
    # 获取所有PNG文件
    png_files = [f for f in os.listdir(src_dir) if f.lower().endswith('.png')]
    
    if not png_files:
        print("❌ 没有找到PNG文件")
        return
    
    print(f"🔍 找到 {len(png_files)} 个PNG文件")
    print("=" * 50)
    
    total_original = 0
    total_compressed = 0
    success_count = 0
    
    for filename in png_files:
        input_path = os.path.join(src_dir, filename)
        backup_path = os.path.join(backup_dir, filename)
        
        # 备份原文件
        if not os.path.exists(backup_path):
            import shutil
            shutil.copy2(input_path, backup_path)
        
        # 压缩图片
        if compress_image(input_path, input_path):
            success_count += 1
            total_original += os.path.getsize(backup_path)
            total_compressed += os.path.getsize(input_path)
    
    print("=" * 50)
    print(f"📊 压缩完成:")
    print(f"   成功: {success_count}/{len(png_files)}")
    print(f"   原始大小: {total_original/1024/1024:.2f}MB")
    print(f"   压缩后: {total_compressed/1024/1024:.2f}MB")
    print(f"   节省空间: {(total_original-total_compressed)/1024/1024:.2f}MB ({(1-total_compressed/total_original)*100:.1f}%)")
    print(f"   备份位置: {backup_dir}")

if __name__ == "__main__":
    main()




