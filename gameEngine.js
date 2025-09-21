// 游戏引擎核心
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
        
        // 异步初始化，等待完成
        this.initialize().catch(error => {
            console.error('游戏初始化失败:', error);
        });
    }

    async initialize() {
        // 设置Canvas尺寸
        this.canvas.width = CONFIG.GAME.CANVAS_WIDTH;
        this.canvas.height = CONFIG.GAME.CANVAS_HEIGHT;
        
        // 先初始化游戏，让用户可以立即开始游戏
        this.backgroundManager = new BackgroundManager(this.imageLoader);
        this.resetGame();
        
        // 设置UI回调（在UI管理器完全初始化后）
        this.uiManager.setCallbacks({
            onGameStart: () => {
                this.startGame();
            },
            onGameRestart: () => {
                this.restartGame();
            },
            onNextLevel: () => {
                this.nextLevel();
            },
            onAudioToggle: () => {
                this.toggleAudio();
            },
            onVolumeChange: (volume) => {
                this.setVolume(volume);
            }
        });
        
        this.uiManager.showStartScreen();
        
        // 初始化音频控制
        this.uiManager.initializeAudioControls(this.audioManager);
        
        // 异步加载资源，不阻塞游戏启动
        this.loadResourcesAsync();
    }
    
    async loadResourcesAsync() {
        // 异步加载图片资源
        try {
            const imageLoadPromise = this.imageLoader.loadAllImages();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('图片加载超时')), 10000)
            );
            
            await Promise.race([imageLoadPromise, timeoutPromise]);
        } catch (error) {
            // 图片加载失败，继续运行
        }
        
        // 异步初始化音频系统
        try {
            const audioInitPromise = this.audioManager.initialize();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('音频初始化超时')), 8000)
            );
            
            await Promise.race([audioInitPromise, timeoutPromise]);
        } catch (error) {
            // 音频初始化失败，继续运行
        }
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
            -CONFIG.GAME.CANVAS_HEIGHT * 10, // minY (允许向上移动10个屏幕高度)
            CONFIG.GAME.CANVAS_HEIGHT * 2 // maxY (允许向下移动2个屏幕高度)
        );
        
        // 重置背景管理器
        if (this.backgroundManager) {
            this.backgroundManager.reset();
            this.backgroundManager.setLevel(this.currentLevel);
        }
        
        // 重置UI
        this.uiManager.reset();
        
        // 预生成怪物
        this.preSpawnEnemies();
    }

    startGame() {
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.levelStartTime = Date.now();
        this.lastTime = 0; // 重置为0，让gameLoop处理第一次调用
        
        this.isRunning = true;
        this.gameLoop();
        
        // 播放BGM
        this.audioManager.playBGM();
        
        this.uiManager.showMessage('游戏开始！', 2000);
    }

    restartGame() {
        // 重新开始游戏
        
        // 先停止当前游戏循环
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 停止BGM
        this.audioManager.stopBGM();
        
        // 重置游戏状态
        this.gameState = 'start';
        
        // 重置游戏
        this.resetGame();
        
        // 重置UI状态 - 隐藏所有游戏界面，显示开始界面
        this.uiManager.hideGameOverScreen();
        this.uiManager.hideLevelCompleteScreen();
        this.uiManager.showStartScreen();
        
        // 不直接启动游戏，让用户点击开始按钮
        // 游戏已重置，等待用户点击开始按钮
    }

    nextLevel() {
        this.currentLevel++;
        this.levelStartTime = Date.now();
        this.gameState = 'playing';
        
        // 清空当前关卡的敌人和障碍物
        this.enemies = [];
        this.obstacles = [];
        this.bullets = []; // 也清空子弹
        
        // 更新背景管理器
        if (this.backgroundManager) {
            this.backgroundManager.setLevel(this.currentLevel);
        }
        
        // 预生成新关卡的怪物
        this.preSpawnEnemies();
        
        // 更新UI
        this.uiManager.updateLevel(this.currentLevel);
        
        this.uiManager.showMessage(`关卡 ${this.currentLevel} 开始！`, 2000);
    }

    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        // 修复第一次调用时deltaTime为0的问题
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        
        const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
        this.lastTime = currentTime;
        
        // 限制deltaTime避免异常大的值
        const clampedDeltaTime = Math.min(deltaTime, 1/30); // 最大30FPS
        
        this.update(clampedDeltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // 更新摄像机
        this.camera.update(deltaTime);
        
        // 更新背景
        if (this.backgroundManager) {
            this.backgroundManager.update(deltaTime);
        }
        
        // 更新输入
        this.inputManager.update(deltaTime);
        
        // 处理玩家输入
        this.handlePlayerInput();
        
        // 更新游戏对象
        this.updatePlayer(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateBullets(deltaTime);
        this.updateObstacles(deltaTime);
        this.updateParticles(deltaTime);
        
        // 生成新敌人和障碍物
        this.spawnEnemies();
        this.spawnObstacles();
        
        // 检查碰撞
        this.checkCollisions();
        
        // 清理无效对象
        this.cleanupObjects();
        
        // 检查关卡完成条件
        this.checkLevelComplete();
        
        // 更新UI
        this.updateUI();
    }

    handlePlayerInput() {
        if (!this.player || !this.player.active) return;
        
        const movement = this.inputManager.getPlayerMovement();
        
        // 水平移动
        if (movement < 0) {
            this.player.moveLeft();
        } else if (movement > 0) {
            this.player.moveRight();
        } else {
            this.player.velocityX = 0;
        }
        
        // 主角自动向上移动
        this.player.autoMove();
        
        // 自动射击
        const bullet = this.player.shoot();
        if (bullet) {
            this.bullets.push(bullet);
            if (CONFIG.DEBUG.ENABLED) {
                // 子弹创建成功
            }
        }
    }

    updatePlayer(deltaTime) {
        if (this.player && this.player.active) {
            this.player.update(deltaTime);
        }
    }

    updateEnemies(deltaTime) {
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                enemy.update(deltaTime, this.player);
                
                // UFO炮塔射击 - 已禁用
                // if (enemy instanceof UFOTurret) {
                //     const bullet = enemy.shoot(this.player, this.camera);
                //     if (bullet) {
                //         this.bullets.push(bullet);
                //     }
                // }
            }
        });
        
        // 更新预生成的怪物（但不激活）
        this.preSpawnedEnemies.forEach(enemy => {
            if (!enemy.active) {
                // 预生成的怪物不更新，只是检查是否需要激活
            }
        });
    }

    updateBullets(deltaTime) {
        this.bullets.forEach(bullet => {
            if (bullet.active) {
                bullet.update(deltaTime);
                if (CONFIG.DEBUG.ENABLED && bullet.owner === 'player') {
                    // 调试：跟踪玩家子弹状态
                    if (Math.random() < 0.01) { // 1%概率输出调试信息
                        // 子弹状态更新
                    }
                }
            }
        });
        
        // 调试：显示子弹总数
        if (CONFIG.DEBUG.ENABLED && Math.random() < 0.01) {
            const activeBullets = this.bullets.filter(b => b.active).length;
            // 子弹清理完成
        }
    }

    updateObstacles(deltaTime) {
        this.obstacles.forEach(obstacle => {
            if (obstacle.active) {
                obstacle.update(deltaTime);
            }
        });
    }

    updateParticles(deltaTime) {
        this.particleSystem.update(deltaTime);
    }

    // 预生成怪物
    preSpawnEnemies() {
        this.preSpawnedEnemies = [];
        const levelConfig = CONFIG.LEVELS[this.currentLevel - 1] || CONFIG.LEVELS[0];
        
        // 预生成足够多的怪物，覆盖整个关卡
        // 根据关卡时长和玩家移动速度计算总距离
        const totalDistance = (levelConfig.DURATION / 1000) * this.player.moveSpeed * 0.5; // 估算关卡总距离
        const spawnDistance = this.enemySpawnDistance;
        
        // 调试信息已隐藏
        
        let totalGenerated = 0;
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
                try {
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
                        enemy.active = false; // 确保敌人初始状态为未激活
                        this.preSpawnedEnemies.push(enemy);
                        totalGenerated++;
                    }
                } catch (error) {
                    console.warn(`创建敌人失败: ${type}`, error);
                }
            }
            
            // 调试信息已隐藏
        }
        
        // 预生成敌人完成
    }

    spawnEnemies() {
        // 检查预生成的怪物是否需要激活
        this.preSpawnedEnemies.forEach(enemy => {
            if (!enemy.active) {
                // 当玩家接近怪物时激活（怪物Y坐标 - 玩家Y坐标 < 1.5倍屏幕高度）
                const distanceToPlayer = enemy.y - this.player.y;
                if (distanceToPlayer < CONFIG.GAME.CANVAS_HEIGHT * 1.5) {
                    // 怪物进入视野范围，激活它
                    enemy.active = true;
                    this.enemies.push(enemy);
                    // 怪物激活成功
                }
            }
        });
        
        // 移除已激活的怪物从预生成列表
        this.preSpawnedEnemies = this.preSpawnedEnemies.filter(enemy => !enemy.active);
    }

    // 查找有效的生成位置，避免重叠
    findValidSpawnPosition(width, height) {
        const maxAttempts = 20; // 最大尝试次数
        const padding = 50; // 怪物之间的最小间距
        
        // 获取玩家位置作为参考
        const playerX = this.player ? this.player.x : CONFIG.GAME.CANVAS_WIDTH / 2;
        const playerY = this.player ? this.player.y : CONFIG.GAME.CANVAS_HEIGHT / 2;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // 在玩家前方生成怪物
            const x = Math.random() * (CONFIG.GAME.CANVAS_WIDTH - width); // 只在屏幕宽度内生成
            const y = playerY - 800 - Math.random() * 400; // 在玩家前方800-1200像素处生成
            
            // 确保在屏幕范围内
            const clampedX = Math.max(0, Math.min(CONFIG.GAME.CANVAS_WIDTH - width, x));
            const clampedY = Math.max(-height, y); // 允许在屏幕上方生成
            
            // 检查是否与现有敌人重叠
            let isValid = true;
            for (const enemy of this.enemies) {
                if (enemy.active) {
                    const distance = Math.sqrt(
                        Math.pow(clampedX - enemy.x, 2) + Math.pow(clampedY - enemy.y, 2)
                    );
                    const minDistance = Math.max(width, enemy.width) / 2 + Math.max(height, enemy.height) / 2 + padding;
                    
                    if (distance < minDistance) {
                        isValid = false;
                        break;
                    }
                }
            }
            
            if (isValid) {
                return { x: clampedX, y: clampedY };
            }
        }
        
        // 如果找不到合适位置，返回null（不生成）
        return null;
    }

    spawnObstacles() {
        const levelConfig = CONFIG.LEVELS[this.currentLevel - 1] || CONFIG.LEVELS[0];
        
        // 废品堆生成已隐藏
        // if (Math.random() < CONFIG.OBSTACLES.JUNK_PILE.SPAWN_RATE * levelConfig.OBSTACLE_SPAWN_MULTIPLIER) {
        //     const position = this.findValidSpawnPosition(CONFIG.OBSTACLES.JUNK_PILE.WIDTH, CONFIG.OBSTACLES.JUNK_PILE.HEIGHT);
        //     if (position) {
        //         const junkPile = new JunkPile(position.x, position.y);
        //         junkPile.velocityY = 100; // 向下移动
        //         this.obstacles.push(junkPile);
        //     }
        // }
    }

    checkCollisions() {
        // 玩家子弹与敌人碰撞
        this.bullets.forEach((bullet, bulletIndex) => {
            if (!bullet.active || bullet.owner !== 'player') return;
            
            this.enemies.forEach((enemy, enemyIndex) => {
                if (!enemy.active) return;
                
                if (bullet.checkCollision(enemy)) {
                    const isDead = enemy.takeDamage(bullet.damage);
                    if (CONFIG.DEBUG.ENABLED) {
                        // 子弹击中敌人
                    }
                    bullet.destroy();
                    
                    if (isDead) {
                        this.score += CONFIG.BALANCE.SCORE_PER_ENEMY;
                        this.particleSystem.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    } else {
                        this.particleSystem.addHitEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    }
                }
            });
            
            // 玩家子弹与障碍物碰撞
            this.obstacles.forEach((obstacle, obstacleIndex) => {
                if (!obstacle.active) return;
                
                if (bullet.checkCollision(obstacle)) {
                    const isDestroyed = obstacle.takeDamage(bullet.damage);
                    bullet.destroy();
                    
                    if (isDestroyed) {
                        this.score += CONFIG.BALANCE.SCORE_PER_OBSTACLE;
                        this.particleSystem.addExplosion(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                    } else {
                        this.particleSystem.addHitEffect(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                    }
                }
            });
        });
        
        // 敌人子弹与玩家碰撞
        this.bullets.forEach((bullet, bulletIndex) => {
            if (!bullet.active || bullet.owner !== 'enemy') return;
            
            if (this.player && this.player.active && bullet.checkCollision(this.player)) {
                const tookDamage = this.player.takeDamage(bullet.damage);
                bullet.destroy();
                
                if (tookDamage) {
                    this.particleSystem.addHitEffect(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
                    this.uiManager.showScreenShake();
                }
            }
        });
        
        // 玩家与敌人碰撞
        if (this.player && this.player.active) {
            this.enemies.forEach(enemy => {
                if (!enemy.active) return;
                
                if (this.player.checkCollision(enemy)) {
                    if (enemy.canAttack()) {
                        const tookDamage = this.player.takeDamage(enemy.damage);
                        enemy.lastAttackTime = Date.now();
                        
                        if (tookDamage) {
                            this.particleSystem.addHitEffect(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
                            this.uiManager.showScreenShake();
                        }
                    }
                }
            });
            
            // 玩家与障碍物碰撞
            this.obstacles.forEach(obstacle => {
                if (!obstacle.active) return;
                
                if (this.player.checkCollision(obstacle)) {
                    if (obstacle instanceof JunkPile) {
                        // 废品堆会造成一次性伤害
                        const currentTime = Date.now();
                        if (!obstacle.lastDamageTime || currentTime - obstacle.lastDamageTime >= 500) { // 0.5秒冷却
                            const tookDamage = this.player.takeDamage(obstacle.damage);
                            obstacle.lastDamageTime = currentTime;
                            
                            if (tookDamage) {
                                this.particleSystem.addHitEffect(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
                                this.uiManager.showScreenShake();
                            }
                        }
                    }
                }
            });
        }
    }

    cleanupObjects() {
        this.enemies = this.enemies.filter(enemy => enemy.active);
        this.bullets = this.bullets.filter(bullet => bullet.active);
        this.obstacles = this.obstacles.filter(obstacle => obstacle.active);
    }

    checkLevelComplete() {
        if (!this.player || !this.player.active) {
            this.gameOver();
            return;
        }
        
        const levelConfig = CONFIG.LEVELS[this.currentLevel - 1];
        if (levelConfig) {
            const levelTime = (Date.now() - this.levelStartTime) / 1000;
            if (levelTime >= levelConfig.DURATION / 1000) {
                this.levelComplete();
            }
        }
    }

    levelComplete() {
        this.gameState = 'levelComplete';
        
        if (this.currentLevel >= CONFIG.LEVELS.length) {
            // 所有关卡完成
            this.uiManager.showMessage('恭喜！所有关卡完成！', 3000);
            setTimeout(() => this.gameOver(), 3000);
        } else {
            this.uiManager.showLevelCompleteScreen();
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 停止BGM
        this.audioManager.stopBGM();
        
        this.uiManager.showGameOverScreen();
    }

    updateUI() {
        const gameTime = (Date.now() - this.gameStartTime) / 1000;
        const levelTime = (Date.now() - this.levelStartTime) / 1000;
        
        // 计算关卡进度百分比
        const levelConfig = CONFIG.LEVELS[this.currentLevel - 1];
        let progress = 0;
        if (levelConfig) {
            progress = Math.min(100, (levelTime / (levelConfig.DURATION / 1000)) * 100);
        }
        
        // 计算剩余怪物数量（包括激活的和未激活的）
        const totalMonsters = this.preSpawnedEnemies.length + this.enemies.length;
        
        this.uiManager.updateGameState({
            player: this.player,
            score: this.score,
            level: this.currentLevel,
            time: levelTime, // 显示当前关卡的时间
            progress: progress, // 关卡进度百分比
            monsterCount: totalMonsters // 剩余怪物数量
        });
    }

    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 应用摄像机变换
        this.camera.applyTransform(this.ctx);
        
        // 绘制背景
        if (this.backgroundManager) {
            this.backgroundManager.render(this.ctx, this.camera);
        } else {
            // 如果背景管理器未加载，使用纯色背景
            const levelConfig = CONFIG.LEVELS[this.currentLevel - 1] || CONFIG.LEVELS[0];
            this.ctx.fillStyle = levelConfig.BACKGROUND_COLOR;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 绘制游戏对象（只绘制在视野内的对象）
        if (this.player && this.player.active) {
            this.player.draw(this.ctx);
        }
        
        // 只绘制在摄像机视野内的敌人
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                const isInView = this.camera.isInView(enemy.x, enemy.y, enemy.width, enemy.height);
                if (isInView) {
                    enemy.draw(this.ctx);
                } else if (CONFIG.DEBUG.ENABLED) {
                    // 调试：显示不在视野内的怪物信息
                    const screenPos = this.camera.worldToScreen(enemy.x, enemy.y);
                    // 怪物不在视野内
                }
                
                // 临时调试：强制绘制所有激活的怪物（红色边框）
                if (CONFIG.DEBUG.ENABLED) {
                    this.ctx.strokeStyle = 'red';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
                }
            }
        });
        
        // 不绘制预生成的未激活怪物
        
        // 只绘制在摄像机视野内的子弹
        this.bullets.forEach(bullet => {
            if (bullet.active && this.camera.isInView(bullet.x, bullet.y, bullet.width, bullet.height)) {
                bullet.draw(this.ctx);
            }
        });
        
        // 只绘制在摄像机视野内的障碍物
        this.obstacles.forEach(obstacle => {
            if (obstacle.active && this.camera.isInView(obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
                obstacle.draw(this.ctx);
            }
        });
        
        // 绘制粒子效果
        this.particleSystem.draw(this.ctx);
        
        // 恢复画布变换
        this.camera.restoreTransform(this.ctx);
        
        // 绘制调试信息（不受摄像机影响）
        if (CONFIG.DEBUG.ENABLED) {
            this.drawDebugInfo();
        }
    }

    drawDebugInfo() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        
        let y = 30;
        const currentTime = Date.now();
        const fps = this.lastTime > 0 ? Math.round(1000 / (currentTime - this.lastTime)) : 0;
        this.ctx.fillText(`FPS: ${fps}`, 10, y);
        y += 20;
        
        // 显示玩家位置
        if (this.player) {
            this.ctx.fillText(`Player: x=${this.player.x.toFixed(1)}, y=${this.player.y.toFixed(1)}`, 10, y);
            y += 20;
            this.ctx.fillText(`Player Health: ${this.player.health}`, 10, y);
            y += 20;
        }
        
        // 显示摄像机位置
        this.ctx.fillText(`Camera: x=${this.camera.x.toFixed(1)}, y=${this.camera.y.toFixed(1)}`, 10, y);
        y += 20;
        this.ctx.fillText(`Camera Bounds: minX=${this.camera.bounds.minX}, maxX=${this.camera.bounds.maxX}`, 10, y);
        y += 20;
        this.ctx.fillText(`Camera Bounds: minY=${this.camera.bounds.minY}, maxY=${this.camera.bounds.maxY}`, 10, y);
        y += 20;
        this.ctx.fillText(`Camera Mode: Horizontal Fixed, Vertical Follow`, 10, y);
        y += 20;
        
        // 统计各类型敌人数量
        const activeEnemies = this.enemies.filter(enemy => enemy.active);
        const barrelCount = activeEnemies.filter(enemy => enemy instanceof BarrelMonster).length;
        const ufoCount = activeEnemies.filter(enemy => enemy instanceof UFOTurret).length;
        const giantCount = activeEnemies.filter(enemy => enemy instanceof GiantMelee).length;
        
        this.ctx.fillText(`Barrel Monsters: ${barrelCount}`, 10, y);
        y += 20;
        this.ctx.fillText(`UFO Turrets: ${ufoCount}`, 10, y);
        y += 20;
        this.ctx.fillText(`Giant Melees: ${giantCount}`, 10, y);
        y += 20;
        this.ctx.fillText(`Total Enemies: ${activeEnemies.length}`, 10, y);
        y += 20;
        this.ctx.fillText(`Pre-spawned Enemies: ${this.preSpawnedEnemies.length}`, 10, y);
        y += 20;
        this.ctx.fillText(`Bullets: ${this.bullets.length}`, 10, y);
        y += 20;
        this.ctx.fillText(`Obstacles: ${this.obstacles.length}`, 10, y);
        y += 20;
        this.ctx.fillText(`Particles: ${this.particleSystem.particles.length}`, 10, y);
        y += 20;
        this.ctx.fillText(`Player Health: ${this.player ? this.player.health : 0}`, 10, y);
        y += 20;
        this.ctx.fillText(`Score: ${this.score}`, 10, y);
        y += 20;
        this.ctx.fillText(`Level: ${this.currentLevel}`, 10, y);
        y += 20;
        this.ctx.fillText(`Game State: ${this.gameState}`, 10, y);
        y += 20;
        
        // 显示关卡进度
        const levelConfig = CONFIG.LEVELS[this.currentLevel - 1];
        if (levelConfig) {
            const levelTime = (Date.now() - this.levelStartTime) / 1000;
            const progress = Math.min(100, (levelTime / (levelConfig.DURATION / 1000)) * 100);
            this.ctx.fillText(`Level Progress: ${Math.round(progress)}%`, 10, y);
        }
    }

    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.isRunning = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            
            // 暂停BGM
            this.audioManager.pauseBGM();
        }
    }

    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.isRunning = true;
            this.lastTime = 0; // 重置为0，让gameLoop处理第一次调用
            this.gameLoop();
            
            // 恢复BGM
            this.audioManager.resumeBGM();
        }
    }

    // 切换音频开关
    toggleAudio() {
        const isEnabled = this.audioManager.isEnabled;
        this.audioManager.setEnabled(!isEnabled);
        
        if (!isEnabled) {
            // 如果之前是禁用的，现在启用并播放BGM
            if (this.gameState === 'playing') {
                this.audioManager.playBGM();
            }
        }
        
        // 更新UI按钮状态
        this.uiManager.updateAudioButton(this.audioManager);
    }
    
    // 设置音量
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
        // 销毁现有游戏引擎实例
        gameEngine.destroy();
        gameEngine = null;
    }
    
    // 初始化新的游戏引擎
    gameEngine = new GameEngine();
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (gameEngine) {
        // 页面卸载，清理游戏资源
        gameEngine.destroy();
        gameEngine = null;
    }
});

// 页面重新加载时清理资源
window.addEventListener('unload', () => {
    if (gameEngine) {
        // 页面重新加载，清理游戏资源
        gameEngine.destroy();
        gameEngine = null;
    }
});
