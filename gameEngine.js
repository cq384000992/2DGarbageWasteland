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
        
        // 加载图片资源（添加超时机制）
        try {
            const imageLoadPromise = this.imageLoader.loadAllImages();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('图片加载超时')), 8000)
            );
            
            await Promise.race([imageLoadPromise, timeoutPromise]);
            this.backgroundManager = new BackgroundManager(this.imageLoader);
            console.log('图片资源加载完成');
        } catch (error) {
            console.warn('图片加载超时或失败，继续初始化:', error.message);
            // 即使图片加载失败，也继续初始化
            this.backgroundManager = new BackgroundManager(this.imageLoader);
        }
        
        // 初始化音频系统（添加超时机制）
        try {
            const audioInitPromise = this.audioManager.initialize();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('音频初始化超时')), 5000)
            );
            
            await Promise.race([audioInitPromise, timeoutPromise]);
            if (CONFIG.DEBUG.ENABLED) {
                console.log('音频系统初始化完成');
            }
        } catch (error) {
            console.error('音频系统初始化失败:', error);
            // 即使音频初始化失败，也继续初始化
        }
        
        // 初始化游戏
        this.resetGame();
        
        // 设置UI回调（在UI管理器完全初始化后）
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
        console.log('重新开始游戏...');
        
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
        console.log('游戏已重置，等待用户点击开始按钮');
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
                console.log(`创建子弹: 位置(${bullet.x.toFixed(1)}, ${bullet.y.toFixed(1)}), 速度(${bullet.velocityX}, ${bullet.velocityY}), 总数: ${this.bullets.length}`);
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
                        console.log(`子弹状态: active=${bullet.active}, y=${bullet.y.toFixed(1)}, velocityY=${bullet.velocityY}, 总数: ${this.bullets.length}`);
                    }
                }
            }
        });
        
        // 调试：显示子弹总数
        if (CONFIG.DEBUG.ENABLED && Math.random() < 0.01) {
            const activeBullets = this.bullets.filter(b => b.active).length;
            console.log(`子弹总数: ${this.bullets.length}, 活跃子弹: ${activeBullets}`);
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
        const totalDistance = levelConfig.DURATION / 1000 * this.player.moveSpeed * 0.5; // 估算关卡总距离
        const spawnPoints = Math.ceil(totalDistance / this.enemySpawnDistance);
        
        // 统计已生成的怪物数量
        let barrelCount = 0;
        let ufoCount = 0;
        let giantCount = 0;
        
        if (CONFIG.DEBUG.ENABLED) {
            console.log(`预生成怪物: 关卡${this.currentLevel} (${levelConfig.DIFFICULTY}), 总距离=${totalDistance}, 生成点=${spawnPoints}, 玩家Y=${this.player.y}`);
            console.log(`关卡配置: Barrel=${levelConfig.MAX_BARREL_MONSTERS}, UFO=${levelConfig.MAX_UFO_TURRETS}, Giant=${levelConfig.MAX_GIANT_MELEES}, 总计=${levelConfig.TOTAL_MONSTERS}`);
            console.log(`关卡描述: ${levelConfig.DESCRIPTION}`);
        }
        
        for (let i = 0; i < spawnPoints; i++) {
            // 开局安全距离：前5秒不生成怪物
            const safeTime = 5; // 5秒安全时间
            const safeDistance = safeTime * this.player.moveSpeed * 0.5; // 5秒 * 390像素/秒 = 1950像素
            const y = this.player.y - safeDistance - (i + 1) * this.enemySpawnDistance;
            
            // 根据关卡进度调整生成密度（前期少，中段开始增多，后期最多）
            const progressRatio = i / spawnPoints; // 0到1的进度比例
            // 使用S型曲线：前期缓慢增长，中段快速增长，后期高密度
            let densityMultiplier;
            if (progressRatio < 0.2) {
                // 前期20%：缓慢增长
                densityMultiplier = 0.3 + (progressRatio / 0.2) * 0.4; // 0.3到0.7
            } else if (progressRatio < 0.5) {
                // 中段30%：快速增长
                const midProgress = (progressRatio - 0.2) / 0.3;
                densityMultiplier = 0.7 + midProgress * 0.8; // 0.7到1.5
            } else if (progressRatio < 0.8) {
                // 后期前段30%：高密度
                const lateProgress = (progressRatio - 0.5) / 0.3;
                densityMultiplier = 1.5 + lateProgress * 0.8; // 1.5到2.3
            } else {
                // 最后20%：最高密度
                const finalProgress = (progressRatio - 0.8) / 0.2;
                densityMultiplier = 2.3 + finalProgress * 0.7; // 2.3到3.0
            }
            
            // 根据关卡进度和总怪物数量计算应该生成的怪物数量
            const totalMonsters = levelConfig.TOTAL_MONSTERS;
            const expectedMonstersAtThisPoint = Math.floor((i / spawnPoints) * totalMonsters);
            const monstersGeneratedSoFar = barrelCount + ufoCount + giantCount;
            const remainingMonsters = totalMonsters - monstersGeneratedSoFar;
            
            // 如果已经生成了足够的怪物，跳过这个生成点
            if (remainingMonsters <= 0) {
                if (CONFIG.DEBUG.ENABLED && i < 5) {
                    console.log(`跳过生成点${i}: 剩余怪物数量为0`);
                }
                continue; // 跳过这个生成点，继续下一个
            }
            
            // 如果当前进度应该生成的怪物数量已经达到，跳过这个生成点
            // 但允许一定的容错范围，避免怪物生成过少
            if (monstersGeneratedSoFar >= expectedMonstersAtThisPoint + 2) {
                if (CONFIG.DEBUG.ENABLED && i < 5) {
                    console.log(`跳过生成点${i}: 已生成${monstersGeneratedSoFar} >= 预期${expectedMonstersAtThisPoint} + 2`);
                }
                continue; // 跳过这个生成点，继续下一个
            }
            
            // 检查当前行是否已有巨型怪
            const hasGiantInRow = this.preSpawnedEnemies.some(existing => 
                Math.abs(existing.y - y) < 50 && existing.constructor.name === 'GiantMelee'
            );
            
            // 根据新规则确定最大怪物数量
            const maxEnemiesPerRow = hasGiantInRow ? 2 : 3;
            
            // 根据关卡进度和剩余数量调整生成策略
            let baseEnemyCount;
            if (remainingMonsters <= 3) {
                baseEnemyCount = 1; // 剩余怪物很少时，每次生成1个
            } else if (remainingMonsters <= 8) {
                baseEnemyCount = Math.random() < 0.6 ? 1 : 2; // 60%概率生成1个，40%概率生成2个
            } else {
                // 怪物数量充足时，根据进度调整密度
                const maxCount = Math.min(maxEnemiesPerRow, Math.floor(remainingMonsters / 5));
                baseEnemyCount = Math.floor(Math.random() * maxCount) + 1; // 1到maxCount个
            }
            
            // 应用密度倍数，但不超过行最大数量
            let enemyCount = Math.floor(baseEnemyCount * densityMultiplier);
            enemyCount = Math.max(1, Math.min(enemyCount, Math.min(maxEnemiesPerRow, remainingMonsters)));
            
            // 为这个生成点生成怪物，避免碰撞
            const playAreaLeft = (CONFIG.GAME.CANVAS_WIDTH - 720) / 2; // 360
            const playAreaRight = playAreaLeft + 720; // 1080
            const spawnWidth = 720 - 60; // 减少边距，增加可用宽度 (660px)
            const spawnLeft = playAreaLeft + 30; // 减少左边距 (390px)
            
            for (let j = 0; j < enemyCount; j++) {
                // 尝试找到不碰撞的位置
                let attempts = 0;
                let validPosition = false;
                let x, enemy;
                
                while (!validPosition && attempts < 50) {
                    // 使用更均匀的分布，而不是完全随机
                    if (attempts < 10) {
                        // 前10次尝试使用均匀分布
                        x = spawnLeft + (j * spawnWidth / enemyCount) + Math.random() * (spawnWidth / enemyCount);
                    } else {
                        // 后续尝试使用随机分布
                        x = spawnLeft + Math.random() * spawnWidth;
                    }
                    
                    // 根据关卡配置智能选择怪物类型
                    let enemyType = null;
                    
                    // 检查当前行已有的怪物数量和类型
                    const currentRowEnemies = this.preSpawnedEnemies.filter(existing => 
                        Math.abs(existing.y - y) < 50
                    );
                    
                    const hasGiantInCurrentRow = currentRowEnemies.some(existing => 
                        existing.constructor.name === 'GiantMelee'
                    );
                    
                    const currentRowEnemyCount = currentRowEnemies.length;
                    
                    // 根据关卡配置和剩余数量选择怪物类型
                    const availableTypes = [];
                    
                    // 油桶怪和飞碟怪：如果当前行没有巨型怪且怪物数量未达到上限，可以生成
                    if (barrelCount < levelConfig.MAX_BARREL_MONSTERS && !hasGiantInCurrentRow) {
                        availableTypes.push('barrel');
                    }
                    if (ufoCount < levelConfig.MAX_UFO_TURRETS && !hasGiantInCurrentRow) {
                        availableTypes.push('ufo');
                    }
                    
                    // 巨型怪：只有在当前行怪物数量少于2个时才能生成
                    if (giantCount < levelConfig.MAX_GIANT_MELEES && currentRowEnemyCount < 2) {
                        availableTypes.push('giant');
                    }
                    
                    // 如果当前行已有巨型怪，只能生成油桶怪或飞碟怪，且总数不超过2个
                    if (hasGiantInCurrentRow && currentRowEnemyCount < 2) {
                        if (barrelCount < levelConfig.MAX_BARREL_MONSTERS) {
                            availableTypes.push('barrel');
                        }
                        if (ufoCount < levelConfig.MAX_UFO_TURRETS) {
                            availableTypes.push('ufo');
                        }
                    }
                    
            // 调试：显示可用类型
            if (CONFIG.DEBUG.ENABLED && i < 5) {
                console.log(`生成点${i}: 可用类型=${availableTypes.join(',')}, 当前计数=(Barrel:${barrelCount}, UFO:${ufoCount}, Giant:${giantCount})`);
                console.log(`生成点${i}: 预期怪物=${expectedMonstersAtThisPoint}, 已生成=${monstersGeneratedSoFar}, 剩余=${remainingMonsters}`);
            }
                    
                    if (availableTypes.length === 0) {
                        if (CONFIG.DEBUG.ENABLED) {
                            console.log(`跳过生成点${i}: 所有怪物类型已达上限 (Barrel:${barrelCount}/${levelConfig.MAX_BARREL_MONSTERS}, UFO:${ufoCount}/${levelConfig.MAX_UFO_TURRETS}, Giant:${giantCount}/${levelConfig.MAX_GIANT_MELEES})`);
                        }
                        continue; // 没有可用的怪物类型，跳过
                    }
                    
                    // 根据关卡进度调整怪物类型权重
                    let typeWeights = {};
                    if (availableTypes.includes('barrel')) {
                        typeWeights.barrel = 0.5; // 基础权重，油桶怪最常见
                    }
                    if (availableTypes.includes('ufo')) {
                        typeWeights.ufo = 0.3; // 基础权重，UFO中等
                    }
                    if (availableTypes.includes('giant')) {
                        typeWeights.giant = 0.2; // 基础权重，巨型怪最少
                    }
                    
                    // 根据关卡进度和生成进度调整权重
                    const levelProgress = this.currentLevel / CONFIG.LEVELS.length;
                    const spawnProgress = i / spawnPoints; // 当前生成点的进度
                    
                    // 后期关卡和后期生成点增加巨型怪物概率
                    if (typeWeights.giant) {
                        typeWeights.giant += levelProgress * 0.2 + spawnProgress * 0.1; // 关卡进度和生成进度都影响
                    }
                    
                    // 根据剩余数量调整权重（剩余少的类型权重降低）
                    const remainingBarrels = levelConfig.MAX_BARREL_MONSTERS - barrelCount;
                    const remainingUFOs = levelConfig.MAX_UFO_TURRETS - ufoCount;
                    const remainingGiants = levelConfig.MAX_GIANT_MELEES - giantCount;
                    const totalRemaining = remainingBarrels + remainingUFOs + remainingGiants;
                    
                    if (typeWeights.barrel && remainingBarrels < totalRemaining * 0.1) {
                        typeWeights.barrel *= 0.5; // 剩余很少时降低权重
                    }
                    if (typeWeights.ufo && remainingUFOs < totalRemaining * 0.1) {
                        typeWeights.ufo *= 0.5;
                    }
                    if (typeWeights.giant && remainingGiants < totalRemaining * 0.1) {
                        typeWeights.giant *= 0.5;
                    }
                    
                    // 根据权重随机选择怪物类型
                    const random = Math.random();
                    let cumulativeWeight = 0;
                    for (const [type, weight] of Object.entries(typeWeights)) {
                        cumulativeWeight += weight;
                        if (random <= cumulativeWeight) {
                            enemyType = type;
                            break;
                        }
                    }
                    
                    // 创建选定的怪物
                    if (enemyType === 'barrel') {
                        enemy = new BarrelMonster(x, y, this.imageLoader);
                        barrelCount++;
                    } else if (enemyType === 'ufo') {
                        enemy = new UFOTurret(x, y, this.imageLoader);
                        ufoCount++;
                    } else if (enemyType === 'giant') {
                        enemy = new GiantMelee(x, y, this.imageLoader);
                        giantCount++;
                    } else {
                        continue; // 没有选择到有效类型，跳过
                    }
                    
                    // 检查与同批次其他怪物的碰撞
                    validPosition = true;
                    for (let k = 0; k < this.preSpawnedEnemies.length; k++) {
                        const existingEnemy = this.preSpawnedEnemies[k];
                        // 检查同一水平线附近的怪物（允许一定Y轴误差）
                        if (Math.abs(existingEnemy.y - y) < 50) { 
                            const distance = Math.abs(x - existingEnemy.x);
                            
                            // 智能间距计算：确保怪物边缘之间有足够间距
                            let minDistance;
                            const maxWidth = Math.max(enemy.width, existingEnemy.width);
                            
                            // 计算两个怪物中心点之间的最小距离
                            // 中心距离 = (怪物1宽度 + 怪物2宽度) / 2 + 边缘间距
                            // 设置基础间距为50像素
                            minDistance = (enemy.width + existingEnemy.width) / 2 + 50;
                            
                            if (distance < minDistance) {
                                validPosition = false;
                                break;
                            }
                        }
                    }
                    
                    attempts++;
                }
                
                if (validPosition) {
                    // 预生成的怪物初始状态为未激活
                    enemy.active = false;
                    this.preSpawnedEnemies.push(enemy);
                    if (CONFIG.DEBUG.ENABLED && Math.random() < 0.1) { // 10%概率输出
                        console.log(`生成怪物: ${enemy.constructor.name} at (${x.toFixed(1)}, ${y.toFixed(1)})`);
                    }
                } else {
                    if (CONFIG.DEBUG.ENABLED) {
                        console.log(`怪物生成失败: 尝试${attempts}次后仍无法找到合适位置`);
                    }
                }
            }
        }
        
        // 输出生成统计信息
        if (CONFIG.DEBUG.ENABLED) {
            console.log(`怪物生成完成: Barrel=${barrelCount}/${levelConfig.MAX_BARREL_MONSTERS}, UFO=${ufoCount}/${levelConfig.MAX_UFO_TURRETS}, Giant=${giantCount}/${levelConfig.MAX_GIANT_MELEES}`);
            console.log(`总生成怪物数量: ${this.preSpawnedEnemies.length}`);
            
            // 调试：显示前几个怪物的位置
            if (this.preSpawnedEnemies.length > 0) {
                console.log('前5个怪物位置:');
                for (let i = 0; i < Math.min(5, this.preSpawnedEnemies.length); i++) {
                    const enemy = this.preSpawnedEnemies[i];
                    console.log(`怪物${i+1}: ${enemy.constructor.name} at (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)})`);
                }
            } else {
                console.log('❌ 没有生成任何怪物！');
            }
        }
    }

    spawnEnemies() {
        // 检查预生成的怪物是否需要激活
        this.preSpawnedEnemies.forEach(enemy => {
            if (!enemy.active) {
                // 当玩家接近怪物时激活（玩家Y坐标 - 怪物Y坐标 < 1.5倍屏幕高度）
                const distanceToPlayer = this.player.y - enemy.y;
                if (distanceToPlayer < CONFIG.GAME.CANVAS_HEIGHT * 1.5) {
                    // 怪物进入视野范围，激活它
                    enemy.active = true;
                    this.enemies.push(enemy);
                    if (CONFIG.DEBUG.ENABLED) {
                        console.log(`激活怪物: ${enemy.constructor.name} at (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}), 距离玩家: ${distanceToPlayer.toFixed(1)}`);
                        console.log(`玩家位置: (${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)})`);
                        console.log(`摄像机位置: (${this.camera.x.toFixed(1)}, ${this.camera.y.toFixed(1)})`);
                    }
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
                        console.log(`子弹击中敌人: 位置(${bullet.x.toFixed(1)}, ${bullet.y.toFixed(1)}), 敌人: ${enemy.constructor.name}, 剩余子弹: ${this.bullets.length - 1}`);
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
                    console.log(`怪物不在视野内: 世界坐标(${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) -> 屏幕坐标(${screenPos.x.toFixed(1)}, ${screenPos.y.toFixed(1)})`);
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
let gameEngine = null;

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
