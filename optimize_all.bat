@echo off
chcp 65001 >nul
echo 🎮 末日垃圾场游戏 - 图片资源优化工具
echo ================================================
echo.

echo 📋 优化步骤:
echo 1. 检查图片分辨率
echo 2. 调整图片尺寸
echo 3. 压缩图片文件
echo 4. 生成优化报告
echo.

echo 按任意键开始优化...
pause >nul

echo.
echo 🔍 步骤1: 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python未安装
    echo 请先安装Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python环境正常

echo.
echo 🔍 步骤2: 检查PIL库...
python -c "from PIL import Image" >nul 2>&1
if errorlevel 1 (
    echo 📦 安装PIL库...
    pip install Pillow
    if errorlevel 1 (
        echo ❌ PIL库安装失败
        pause
        exit /b 1
    )
)

echo ✅ PIL库已就绪

echo.
echo 📏 步骤3: 检查和调整图片尺寸...
python resize_images.py
if errorlevel 1 (
    echo ❌ 尺寸调整失败
    pause
    exit /b 1
)

echo.
echo 🗜️ 步骤4: 压缩图片文件...
python compress_images.py
if errorlevel 1 (
    echo ❌ 图片压缩失败
    pause
    exit /b 1
)

echo.
echo 📊 步骤5: 生成优化报告...
echo 正在生成报告...

echo.
echo ================================================
echo ✅ 优化完成！
echo.
echo 📁 备份文件位置: src_backup\
echo 🎮 优化后文件位置: src\
echo.
echo 💡 建议:
echo - 测试游戏运行是否正常
echo - 检查图片质量是否满意
echo - 如有问题可从备份恢复
echo.
echo 按任意键退出...
pause >nul




