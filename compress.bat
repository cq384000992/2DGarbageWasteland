@echo off
echo 图片压缩工具
echo ================

echo 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python未安装或不在PATH中
    echo 请安装Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo 检查PIL库...
python -c "from PIL import Image" >nul 2>&1
if errorlevel 1 (
    echo ❌ PIL库未安装
    echo 正在安装PIL库...
    pip install Pillow
    if errorlevel 1 (
        echo ❌ PIL库安装失败
        pause
        exit /b 1
    )
)

echo ✅ 环境检查完成
echo.
echo 开始压缩图片...
python compress_images.py

echo.
echo 压缩完成！按任意键退出...
pause >nul



