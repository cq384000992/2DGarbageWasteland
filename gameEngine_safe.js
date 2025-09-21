// 游戏引擎核心 - 安全版本
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element with id "gameCanvas" not found');
        }
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Failed to get 2D context from canvas');
        }
        
        // 游戏状态
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver', 'levelComplete'
        this.currentLevel = 1;
        this.score = 0;
        this.gameStartTime = 0;
        this.levelStartTime = 0;
        this.lastTime = 0;
        
        // 游戏对象
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.obstacles = [];
        this.particleSystem = new ParticleSystem();
        
        // 预生成怪物系统
        this.preSpawnedEnemies = [];
        this.enemySpawnDistance = 300; // 每300像素生成一批怪物（增加间距）
        
        // 管理器
        this.inputManager = InputManager.getInstance();
        this.uiManager = UIManagerSingleton.getInstance().getUIManager();
        this.imageLoader = new ImageLoader();
        this.backgroundManager = null;
        this.audioManager = AudioManagerSingleton.getInstance().getAudioManager();
        this.camera = new Camera();
        
        // 游戏循环
        this.animationId = null;
        this.isRunning = false;
        
        // 安全初始化，跳过可能阻塞的操作
        this.safeInitialize();
    }

    safeInitialize() {
        console.log('开始安全初始化...');
        
        // 设置Canvas尺寸
        this.canvas.width = CONFIG.GAME.CANVAS_WIDTH;
        this.canvas.height = CONFIG.GAME.CANVAS_HEIGHT;
        
        // 跳过图片和音频加载，直接初始化游戏
        console.log('跳过资源加载，直接初始化游戏...');
        this.backgroundManager = new BackgroundManager(this.imageLoader);
        
        // 初始化游戏
        this.resetGame();
        
        // 设置UI回调
        console.log('设置UI回调...');
        this.uiManager.setCallbacks({
            onGameStart: () => {
                console.log('UI回调：游戏开始');
                this.startGame();
            },
            onGameRestart: () => {
                console.log('UI回调：游戏重启');
                this.restartGame();
            },
            onNextLevel: () => {
                console.log('UI回调：下一关');
                this.nextLevel();
            },
            onAudioToggle: () => {
                console.log('UI回调：音频切换');
                this.toggleAudio();
            },
            onVolumeChange: (volume) => {
                console.log('UI回调：音量改变', volume);
                this.setVolume(volume);
            }
        });
        
        console.log('显示开始界面...');
        this.uiManager.showStartScreen();
        
        // 初始化音频控制
        this.uiManager.initializeAudioControls(this.audioManager);
        
        console.log('安全初始化完成！');
    }

    resetGame() {
        // 重置游戏状态
        this.gameState = 'start';
        this.currentLevel = 1;
        this.score = 0;
        this.gameStartTime = 0;
        this.levelStartTime = 0;
        
        // 清空游戏对象
        this.enemies = [];
        this.bullets = [];
        this.obstacles = [];
        this.particleSystem = new ParticleSystem();
        
        // 创建玩家
        this.player = new Player(CONFIG.PLAYER.START_X, CONFIG.PLAYER.START_Y, this.imageLoader);
        
        // 设置摄像机跟随玩家
        this.camera.setTarget(this.player);
        this.camera.reset();
        
        // 设置摄像机初始位置（让主角在画面中央）
        this.camera.setPosition(CONFIG.GAME.CANVAS_WIDTH / 2, this.player.y);
        
        // 设置摄像机边界（世界坐标）
        // 摄像机水平方向固定，垂直方向跟随主角
        this.camera.setBounds(
            CONFIG.GAME.CANVAS_WIDTH / 2, // minX (水平位置固定在屏幕中央)
            CONFIG.GAME.CANVAS_WIDTH / 2, // maxX (水平位置固定在屏幕中央)
            -Infinity, // minY (垂直方向不限制)
            Infinity  // maxY (垂直方向不限制)
        );
        
        // 预生成敌人
        this.preSpawnEnemies();
        
        // 重置UI
        this.uiManager.updateHealth(this.player.health, this.player.maxHealth);
        this.uiManager.updateScore(this.score);
        this.uiManager.updateLevel(this.currentLevel);
        this.uiManager.updateTime(0);
        this.uiManager.updateProgress(0);
        this.uiManager.updateMonsterCount(0);
    }

    preSpawnEnemies() {
        this.preSpawnedEnemies = [];
        
        // 根据关卡生成敌人
        const levelConfig = CONFIG.LEVELS[this.currentLevel - 1];
        if (!levelConfig) {
            console.warn(`关卡配置不存在: ${this.currentLevel}`);
            return;
        }
        
        const totalDistance = levelConfig.TOTAL_DISTANCE;
        const spawnDistance = this.enemySpawnDistance;
        
        for (let distance = spawnDistance; distance < totalDistance; distance += spawnDistance) {
            const progress = distance / totalDistance;
            const row = Math.floor(distance / spawnDistance);
            
            // 根据进度确定每行的最大敌人数量
            let maxEnemiesPerRow = 3; // 默认最多3个
            
            // 检查这一行是否包含巨型近战怪
            const hasGiantInCurrentRow = Math.random() < 0.3; // 30%概率有巨型近战怪
            if (hasGiantInCurrentRow) {
                maxEnemiesPerRow = 2; // 有巨型近战怪时最多2个
            }
            
            // 计算基础敌人数量
            let baseEnemyCount = Math.floor(Math.random() * maxEnemiesPerRow) + 1;
            let enemyCount = Math.min(baseEnemyCount, maxEnemiesPerRow);
            
            // 根据进度调整密度
            let densityMultiplier = 1.0;
            if (progress < 0.2) {
                densityMultiplier = 0.3 + (progress / 0.2) * 0.4; // 0.3-0.7
            } else if (progress < 0.5) {
                densityMultiplier = 0.7 + ((progress - 0.2) / 0.3) * 0.8; // 0.7-1.5
            } else if (progress < 0.8) {
                densityMultiplier = 1.5 + ((progress - 0.5) / 0.3) * 0.8; // 1.5-2.3
            } else {
                densityMultiplier = 2.3 + ((progress - 0.8) / 0.2) * 0.7; // 2.3-3.0
            }
            
            enemyCount = Math.floor(enemyCount * densityMultiplier);
            enemyCount = Math.min(enemyCount, maxEnemiesPerRow);
            
            // 生成敌人类型
            const availableTypes = [];
            if (hasGiantInCurrentRow) {
                availableTypes.push('GiantMelee');
                if (enemyCount > 1) {
                    availableTypes.push('BarrelMonster', 'UFOTurret');
                }
            } else {
                availableTypes.push('BarrelMonster', 'UFOTurret');
            }
            
            for (let i = 0; i < enemyCount; i++) {
                const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                const x = CONFIG.GAME.CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 400;
                const y = -distance + Math.random() * 100;
                
                let enemy;
                switch (type) {
                    case 'BarrelMonster':
                        enemy = new BarrelMonster(x, y, this.imageLoader);
                        break;
                    case 'UFOTurret':
                        enemy = new UFOTurret(x, y, this.imageLoader);
                        break;
                    case 'GiantMelee':
                        enemy = new GiantMelee(x, y, this.imageLoader);
                        break;
                }
                
                if (enemy) {
                    this.preSpawnedEnemies.push(enemy);
                }
            }
        }
        
        console.log(`预生成敌人完成，共 ${this.preSpawnedEnemies.length} 个敌人`);
    }

    startGame() {
        if (this.gameState !== 'start') {
            return;
        }
        
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.levelStartTime = Date.now();
        this.lastTime = Date.now();
        
        this.uiManager.hideStartScreen();
        this.uiManager.showGameUI();
        
        this.isRunning = true;
        this.gameLoop();
        
        console.log('游戏开始！');
    }

    restartGame() {
        this.gameState = 'start';
        this.resetGame();
        this.uiManager.showStartScreen();
        this.uiManager.hideGameOverScreen();
        this.uiManager.hideLevelCompleteScreen();
        
        console.log('游戏重启！');
    }

    nextLevel() {
        this.currentLevel++;
        this.resetGame();
        this.uiManager.hideLevelCompleteScreen();
        this.uiManager.showStartScreen();
        
        console.log(`进入第 ${this.currentLevel} 关！`);
    }

    gameLoop() {
        if (!this.isRunning) {
            return;
        }
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') {
            return;
        }
        
        // 更新玩家
        if (this.player) {
            this.player.update(deltaTime, this.inputManager);
        }
        
        // 更新敌人
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.player);
        });
        
        // 更新子弹
        this.bullets.forEach(bullet => {
            bullet.update(deltaTime);
        });
        
        // 更新粒子系统
        this.particleSystem.update(deltaTime);
        
        // 碰撞检测
        this.checkCollisions();
        
        // 清理超出屏幕的对象
        this.cleanupObjects();
        
        // 生成新敌人
        this.spawnEnemies();
        
        // 更新UI
        this.updateUI();
        
        // 检查游戏结束条件
        this.checkGameEnd();
    }

    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染背景
        if (this.backgroundManager) {
            this.backgroundManager.render(this.ctx, this.camera);
        }
        
        // 渲染游戏对象
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        this.enemies.forEach(enemy => {
            enemy.draw(this.ctx);
        });
        
        this.bullets.forEach(bullet => {
            bullet.draw(this.ctx);
        });
        
        this.obstacles.forEach(obstacle => {
            obstacle.draw(this.ctx);
        });
        
        // 渲染粒子系统
        this.particleSystem.render(this.ctx);
    }

    checkCollisions() {
        // 玩家与敌人碰撞
        this.enemies.forEach((enemy, enemyIndex) => {
            if (this.player && this.player.checkCollision(enemy)) {
                this.player.takeDamage(enemy.damage);
                this.enemies.splice(enemyIndex, 1);
            }
        });
        
        // 子弹与敌人碰撞
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (bullet.checkCollision(enemy)) {
                    const damage = enemy.takeDamage(bullet.damage);
                    if (damage) {
                        this.score += enemy.scoreValue;
                        this.particleSystem.addExplosion(enemy.x, enemy.y);
                        this.enemies.splice(enemyIndex, 1);
                    }
                    this.bullets.splice(bulletIndex, 1);
                }
            });
        });
    }

    cleanupObjects() {
        // 清理超出屏幕的子弹
        this.bullets = this.bullets.filter(bullet => 
            bullet.y > -100 && bullet.y < this.canvas.height + 100
        );
        
        // 清理超出屏幕的敌人
        this.enemies = this.enemies.filter(enemy => 
            enemy.y < this.canvas.height + 200
        );
    }

    spawnEnemies() {
        if (!this.player) return;
        
        const playerY = this.player.y;
        const spawnY = playerY - this.enemySpawnDistance;
        
        // 检查是否有敌人需要生成
        this.preSpawnedEnemies.forEach((enemy, index) => {
            if (enemy.y >= spawnY && enemy.y < spawnY + 100) {
                this.enemies.push(enemy);
                this.preSpawnedEnemies.splice(index, 1);
            }
        });
    }

    updateUI() {
        if (this.player) {
            this.uiManager.updateHealth(this.player.health, this.player.maxHealth);
        }
        this.uiManager.updateScore(this.score);
        this.uiManager.updateLevel(this.currentLevel);
        
        const currentTime = Date.now();
        const gameTime = Math.floor((currentTime - this.gameStartTime) / 1000);
        this.uiManager.updateTime(gameTime);
        
        const progress = Math.min(100, Math.max(0, (this.player.y / CONFIG.LEVELS[this.currentLevel - 1].TOTAL_DISTANCE) * 100));
        this.uiManager.updateProgress(progress);
        
        this.uiManager.updateMonsterCount(this.enemies.length);
    }

    checkGameEnd() {
        if (this.player && this.player.health <= 0) {
            this.gameState = 'gameOver';
            this.isRunning = false;
            this.uiManager.showGameOverScreen(this.score, this.currentLevel);
        } else if (this.enemies.length === 0 && this.preSpawnedEnemies.length === 0) {
            this.gameState = 'levelComplete';
            this.isRunning = false;
            this.uiManager.showLevelCompleteScreen();
        }
    }

    toggleAudio() {
        this.audioManager.toggleMute();
        this.uiManager.updateAudioButton(this.audioManager);
    }
    
    setVolume(volume) {
        this.audioManager.setVolume(volume);
        this.uiManager.updateAudioButton(this.audioManager);
    }

    destroy() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 清理音频资源
        if (this.audioManager) {
            this.audioManager.destroy();
        }
        
        // 清理单例管理器
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        if (this.uiManager) {
            this.uiManager.destroy();
        }
        
        // 清理单例实例
        InputManager.instance = null;
        UIManagerSingleton.instance = null;
        AudioManagerSingleton.instance = null;
    }
}

// 游戏初始化
if (typeof gameEngine === 'undefined') {
    var gameEngine = null;
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 如果已经存在游戏引擎实例，先销毁
    if (gameEngine) {
        console.log('销毁现有游戏引擎实例...');
        gameEngine.destroy();
        gameEngine = null;
    }
    
    console.log('初始化新的游戏引擎...');
    gameEngine = new GameEngine();
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (gameEngine) {
        console.log('页面卸载，清理游戏资源...');
        gameEngine.destroy();
        gameEngine = null;
    }
});

// 页面重新加载时清理资源
window.addEventListener('unload', () => {
    if (gameEngine) {
        console.log('页面重新加载，清理游戏资源...');
        gameEngine.destroy();
        gameEngine = null;
    }
});
