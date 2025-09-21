// 图片资源加载器
class ImageLoader {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onLoadComplete = null;
    }

    // 加载所有图片资源
    async loadAllImages() {
        const imagePaths = {
            // 主角行走动画帧
            'player_walk_01': 'src/player_walk_01.png',
            'player_walk_02': 'src/player_walk_02.png',
            'player_walk_03': 'src/player_walk_03.png',
            'player_walk_04': 'src/player_walk_04.png',
            
            // 怪物静态图片
            'monster_01': 'src/monster_01.png',
            'monster_02': 'src/monster_02.png',
            'monster_03': 'src/monster_03.png',
            
            // 背景图片
            'bg_road_01': 'src/bg_road_01.png',
            'bg_road_02': 'src/bg_road_02.png',
            'bg_road_03': 'src/bg_road_03.png',
            'bg_road_04': 'src/bg_road_04.png',
            'bg_road_05': 'src/bg_road_05.png'
        };

        this.totalCount = Object.keys(imagePaths).length;
        this.loadedCount = 0;

        const loadPromises = Object.entries(imagePaths).map(([key, path]) => 
            this.loadImage(key, path)
        );

        try {
            await Promise.all(loadPromises);
            console.log('所有图片资源加载完成');
            if (this.onLoadComplete) {
                this.onLoadComplete();
            }
        } catch (error) {
            console.error('图片加载失败:', error);
        }
    }

    // 加载单个图片
    loadImage(key, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // 设置超时机制
            const timeout = setTimeout(() => {
                console.warn(`图片加载超时: ${key} - ${path}`);
                // 创建一个占位图片
                const placeholder = new Image();
                placeholder.width = 100;
                placeholder.height = 100;
                this.images[key] = placeholder;
                this.loadedCount++;
                resolve(placeholder);
            }, 5000); // 5秒超时
            
            img.onload = () => {
                clearTimeout(timeout);
                this.images[key] = img;
                this.loadedCount++;
                console.log(`图片加载完成: ${key} (${this.loadedCount}/${this.totalCount})`);
                resolve(img);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                console.warn(`图片加载失败: ${key} - ${path}，使用占位图片`);
                // 创建一个占位图片而不是拒绝Promise
                const placeholder = new Image();
                placeholder.width = 100;
                placeholder.height = 100;
                this.images[key] = placeholder;
                this.loadedCount++;
                resolve(placeholder);
            };
            
            img.src = path;
        });
    }

    // 获取图片
    getImage(key) {
        return this.images[key];
    }

    // 检查是否所有图片都已加载
    isLoaded() {
        return this.loadedCount === this.totalCount;
    }

    // 获取加载进度
    getLoadProgress() {
        return this.totalCount > 0 ? (this.loadedCount / this.totalCount) * 100 : 0;
    }
}

// 精灵动画系统
class SpriteAnimation {
    constructor(imageLoader, frames, frameDuration = 200) {
        this.imageLoader = imageLoader;
        this.frames = frames; // 帧名称数组
        this.frameDuration = frameDuration; // 每帧持续时间(毫秒)
        this.currentFrame = 0;
        this.lastFrameTime = 0;
        this.isPlaying = true;
        this.loop = true;
    }

    // 更新动画
    update(deltaTime) {
        if (!this.isPlaying) return;

        this.lastFrameTime += deltaTime * 1000; // 转换为毫秒

        if (this.lastFrameTime >= this.frameDuration) {
            this.currentFrame++;
            this.lastFrameTime = 0;

            if (this.currentFrame >= this.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frames.length - 1;
                    this.isPlaying = false;
                }
            }
        }
    }

    // 获取当前帧图片
    getCurrentFrame() {
        if (this.frames.length === 0) return null;
        const frameName = this.frames[this.currentFrame];
        return this.imageLoader.getImage(frameName);
    }

    // 播放动画
    play() {
        this.isPlaying = true;
    }

    // 暂停动画
    pause() {
        this.isPlaying = false;
    }

    // 重置动画
    reset() {
        this.currentFrame = 0;
        this.lastFrameTime = 0;
    }

    // 设置帧率
    setFrameDuration(duration) {
        this.frameDuration = duration;
    }
}

// 背景管理器
class BackgroundManager {
    constructor(imageLoader) {
        this.imageLoader = imageLoader;
        this.backgrounds = ['bg_road_01', 'bg_road_02', 'bg_road_03', 'bg_road_04', 'bg_road_05'];
        this.currentLevel = 1;
        this.scrollOffset = 0;
        this.scrollSpeed = 50; // 背景滚动速度
    }

    // 设置当前关卡
    setLevel(level) {
        this.currentLevel = level;
    }

    // 更新背景滚动
    update(deltaTime) {
        this.scrollOffset += this.scrollSpeed * deltaTime;
        
        // 重置滚动偏移，实现循环
        const backgroundHeight = CONFIG.GAME.CANVAS_HEIGHT;
        if (this.scrollOffset >= backgroundHeight) {
            this.scrollOffset = 0;
        }
    }

    // 渲染背景
    render(ctx, camera) {
        const canvasWidth = CONFIG.GAME.CANVAS_WIDTH;
        const canvasHeight = CONFIG.GAME.CANVAS_HEIGHT;

        // 根据关卡进度选择背景
        const backgroundIndex = this.getBackgroundIndex();
        const backgroundImage = this.imageLoader.getImage(this.backgrounds[backgroundIndex]);

        if (backgroundImage) {
            // 根据摄像机位置动态计算需要渲染的背景数量
            const cameraY = camera ? camera.y : 0;
            const backgroundHeight = backgroundImage.height;
            
            // 计算摄像机视野范围内的背景索引
            const startIndex = Math.floor((cameraY - canvasHeight) / backgroundHeight) - 2;
            const endIndex = Math.ceil((cameraY + canvasHeight) / backgroundHeight) + 2;
            
            // 渲染视野范围内的背景
            for (let i = startIndex; i <= endIndex; i++) {
                const y = i * backgroundHeight;
                ctx.drawImage(backgroundImage, 0, y, canvasWidth, backgroundHeight);
            }
        } else {
            // 如果图片未加载，使用纯色背景覆盖更大区域
            const levelConfig = CONFIG.LEVELS[this.currentLevel - 1] || CONFIG.LEVELS[0];
            ctx.fillStyle = levelConfig.BACKGROUND_COLOR;
            const cameraY = camera ? camera.y : 0;
            ctx.fillRect(0, cameraY - canvasHeight * 2, canvasWidth, canvasHeight * 4);
        }
    }

    // 根据关卡进度获取背景索引
    getBackgroundIndex() {
        const levelConfig = CONFIG.LEVELS[this.currentLevel - 1];
        if (!levelConfig) return 0;

        const levelTime = (Date.now() - window.gameEngine?.levelStartTime || 0) / 1000;
        const progress = Math.min(1, levelTime / (levelConfig.DURATION / 1000));

        if (progress === 0) {
            return 0; // 开局使用 bg_road_01
        } else if (progress >= 1) {
            return 4; // 结尾使用 bg_road_05
        } else {
            // 中途使用 2-4 循环
            const cycleProgress = (progress - 0.1) / 0.8; // 从10%到90%的进度
            const cycleIndex = Math.floor(cycleProgress * 3) % 3; // 0, 1, 2 循环
            return cycleIndex + 1; // 返回 1, 2, 3 (对应 bg_road_02, 03, 04)
        }
    }

    // 重置背景
    reset() {
        this.scrollOffset = 0;
    }
}
