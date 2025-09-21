// 摄像机系统
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.followSpeed = 5; // 跟随速度
        this.bounds = {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        };
        this.shake = {
            intensity: 0,
            duration: 0,
            startTime: 0
        };
    }

    // 设置跟随目标
    setTarget(target) {
        this.target = target;
    }

    // 更新摄像机位置
    update(deltaTime) {
        if (this.target) {
            // 摄像机水平方向固定，垂直方向跟随主角
            this.targetX = CONFIG.GAME.CANVAS_WIDTH / 2; // 摄像机水平位置固定在屏幕中央
            this.targetY = this.target.y; // 摄像机Y位置跟随主角Y位置
            
            // 立即跟随，不使用平滑过渡
            this.x = this.targetX;
            this.y = this.targetY;
            
            // 应用边界限制
            this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.x));
            this.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.y));
            
            // 调试信息（降低输出频率）
            if (CONFIG.DEBUG.ENABLED && Math.random() < 0.01) { // 1%概率输出
                console.log(`Camera: x=${this.x.toFixed(1)}, y=${this.y.toFixed(1)}, targetX=${this.targetX.toFixed(1)}, targetY=${this.targetY.toFixed(1)}`);
                console.log(`Player: x=${this.target.x.toFixed(1)}, y=${this.target.y.toFixed(1)}`);
            }
        }
        
        // 处理屏幕震动
        this.updateShake(deltaTime);
    }

    // 设置边界
    setBounds(minX, maxX, minY, maxY) {
        this.bounds = { minX, maxX, minY, maxY };
    }

    // 世界坐标转屏幕坐标
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x + CONFIG.GAME.CANVAS_WIDTH / 2,
            y: worldY - this.y + CONFIG.GAME.CANVAS_HEIGHT / 2
        };
    }

    // 屏幕坐标转世界坐标
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x - CONFIG.GAME.CANVAS_WIDTH / 2,
            y: screenY + this.y - CONFIG.GAME.CANVAS_HEIGHT / 2
        };
    }

    // 检查对象是否在摄像机视野内
    isInView(worldX, worldY, width, height) {
        const screenPos = this.worldToScreen(worldX, worldY);
        return screenPos.x + width >= 0 && 
               screenPos.x <= CONFIG.GAME.CANVAS_WIDTH &&
               screenPos.y + height >= 0 && 
               screenPos.y <= CONFIG.GAME.CANVAS_HEIGHT;
    }

    // 应用摄像机变换到画布
    applyTransform(ctx) {
        ctx.save();
        
        // 应用摄像机偏移，让摄像机位置对应屏幕中央
        ctx.translate(-this.x + CONFIG.GAME.CANVAS_WIDTH / 2, -this.y + CONFIG.GAME.CANVAS_HEIGHT / 2);
        
        // 应用屏幕震动
        if (this.shake.intensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.shake.intensity;
            const shakeY = (Math.random() - 0.5) * this.shake.intensity;
            ctx.translate(shakeX, shakeY);
        }
    }

    // 恢复画布变换
    restoreTransform(ctx) {
        ctx.restore();
    }

    // 开始屏幕震动
    startShake(intensity, duration) {
        this.shake.intensity = intensity;
        this.shake.duration = duration;
        this.shake.startTime = Date.now();
    }

    // 更新屏幕震动
    updateShake(deltaTime) {
        if (this.shake.intensity > 0) {
            const elapsed = Date.now() - this.shake.startTime;
            if (elapsed >= this.shake.duration) {
                this.shake.intensity = 0;
            } else {
                // 震动强度随时间衰减
                const progress = elapsed / this.shake.duration;
                this.shake.intensity = this.shake.intensity * (1 - progress);
            }
        }
    }

    // 获取摄像机位置
    getPosition() {
        return { x: this.x, y: this.y };
    }

    // 设置摄像机位置
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    // 重置摄像机
    reset() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.shake.intensity = 0;
        this.shake.duration = 0;
    }
}
