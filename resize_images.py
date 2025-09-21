#!/usr/bin/env python3
"""
图片分辨率检查和缩放脚本
根据游戏配置调整图片尺寸
"""

import os
from PIL import Image
import json

# 游戏配置中的预期尺寸
EXPECTED_SIZES = {
    'player_walk_01': (400, 600),
    'player_walk_02': (400, 600),
    'player_walk_03': (400, 600),
    'player_walk_04': (400, 600),
    'monster_01': (300, 450),
    'monster_02': (400, 600),
    'monster_03': (500, 750),
    'bg_road_01': (1440, 2560),
    'bg_road_02': (1440, 2560),
    'bg_road_03': (1440, 2560),
    'bg_road_04': (1440, 2560),
    'bg_road_05': (1440, 2560)
}

def check_and_resize_image(filename, expected_size):
    """
    检查并调整图片尺寸
    
    Args:
        filename: 文件名
        expected_size: 期望尺寸 (width, height)
    """
    input_path = f"src/{filename}.png"
    backup_path = f"src_backup/{filename}.png"
    
    if not os.path.exists(input_path):
        print(f"❌ 文件不存在: {input_path}")
        return False
    
    try:
        with Image.open(input_path) as img:
            current_size = img.size
            expected_width, expected_height = expected_size
            
            print(f"📏 {filename}: {current_size[0]}x{current_size[1]} → {expected_width}x{expected_height}")
            
            # 检查是否需要调整尺寸
            if current_size != expected_size:
                # 创建备份
                if not os.path.exists("src_backup"):
                    os.makedirs("src_backup")
                
                if not os.path.exists(backup_path):
                    img.save(backup_path)
                    print(f"   💾 已备份到: {backup_path}")
                
                # 调整尺寸
                resized_img = img.resize(expected_size, Image.Resampling.LANCZOS)
                resized_img.save(input_path, 'PNG', optimize=True)
                print(f"   ✅ 已调整尺寸")
                return True
            else:
                print(f"   ✅ 尺寸正确")
                return True
                
    except Exception as e:
        print(f"❌ 处理失败 {filename}: {e}")
        return False

def main():
    """主函数"""
    print("🔍 图片分辨率检查和调整")
    print("=" * 50)
    
    if not os.path.exists("src"):
        print("❌ src目录不存在")
        return
    
    success_count = 0
    total_count = len(EXPECTED_SIZES)
    
    for filename, expected_size in EXPECTED_SIZES.items():
        if check_and_resize_image(filename, expected_size):
            success_count += 1
        print()
    
    print("=" * 50)
    print(f"📊 处理完成: {success_count}/{total_count}")
    
    if success_count == total_count:
        print("✅ 所有图片尺寸都已正确")
    else:
        print("⚠️ 部分图片处理失败，请检查错误信息")

if __name__ == "__main__":
    main()



