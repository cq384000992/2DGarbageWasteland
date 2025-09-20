// 末日垃圾场游戏引擎核心

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 初始化各个模块
        this.inputHandler = new InputHandler(this.canvas);
        this.uiManager = new UIManager();
        
        // 游戏状态
        this.gameState = {
            isRunning: false, // 初始状态为未运行
            isPaused: false,
            currentDistance: 0,
            playerHP: CONFIG.PLAYER.HP,
            enemiesKilled: 0,
            lastAttackTime: 0,
            skill1Cooldown: 0,
            skill2Cooldown: 0,
            shieldActive: false,
            shieldEndTime: 0
        };
        
        // 镜头系统
        this.camera = {
            x: 0,
            y: 0
        };
        
        // 游戏对象
        this.gameObjects = {
            player: null,
            bullets: [],
            enemyBullets: [],
            enemies: [],
            obstacles: [],
            particles: [],
            backgroundSegments: []
        };
        
        // 关卡生成器
        this.levelGenerator = null;
        
        // 游戏循环
        this.lastTime = 0;
        this.animationId = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 开始游戏按钮
        this.uiManager.setupStartButton(() => {
            this.startGame();
        });
        
        // 技能按钮
        this.uiManager.setupSkillButtons(
            () => this.useSkill1(),
            () => this.useSkill2()
        );
        
        // 重新开始按钮
        this.uiManager.setupRestartButton(() => {
            this.initGame();
            this.start();
        });
        
        // 窗口大小调整
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = CONFIG.LEVEL.GAME_WIDTH;
        this.canvas.height = window.innerHeight;
        
        // 居中显示
        this.canvas.style.margin = '0 auto';
        this.canvas.style.display = 'block';
    }

    initGame() {
        this.resizeCanvas();
        
        // 重置游戏状态
        this.gameState = {
            isRunning: true,
            isPaused: false,
            currentDistance: 0,
            playerHP: CONFIG.PLAYER.HP,
            enemiesKilled: 0,
            lastAttackTime: 0,
            skill1Cooldown: 0,
            skill2Cooldown: 0,
            shieldActive: false,
            shieldEndTime: 0
        };
        
        // 清空游戏对象
        this.gameObjects = {
            player: new Player(this.canvas),
            bullets: [],
            enemyBullets: [],
            enemies: [],
            obstacles: [],
            particles: [],
            backgroundSegments: []
        };
        
        // 初始化背景段 - 生成更多段以确保覆盖
        for (let i = -2; i < 15; i++) { // 从-2开始，生成17个段
            const segment = new BackgroundSegment(i * CONFIG.LEVEL.SEGMENT_LENGTH, 'normal');
            this.gameObjects.backgroundSegments.push(segment);
        }
        
        // 预先生成所有敌人和障碍物
        this.preGenerateLevel();
        
        // 隐藏游戏结束界面
        this.uiManager.hideGameOver();
        
        // 更新UI
        this.updateUI();
    }

    useSkill1() {
        if (this.gameState.skill1Cooldown > 0) return;
        
        // 找到最近的敌人
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        this.gameObjects.enemies.forEach(enemy => {
            if (enemy.y < this.gameObjects.player.y) { // 只锁定上方的敌人
                const distance = Math.sqrt(
                    Math.pow(enemy.x - this.gameObjects.player.x, 2) + 
                    Math.pow(enemy.y - this.gameObjects.player.y, 2)
                );
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }
        });
        
        if (nearestEnemy) {
            const effect = new SkillEffect(nearestEnemy.x, nearestEnemy.y, 'magnetic');
            this.gameObjects.particles.push(effect);
        }
        
        this.gameState.skill1Cooldown = CONFIG.SKILLS.MAGNETIC_BOMB.COOLDOWN;
    }

    useSkill2() {
        if (this.gameState.skill2Cooldown > 0) return;
        
        this.gameState.shieldActive = true;
        this.gameState.shieldEndTime = Date.now() + CONFIG.SKILLS.SHIELD.DURATION;
        
        const effect = new SkillEffect(this.gameObjects.player.x, this.gameObjects.player.y, 'shield');
        this.gameObjects.particles.push(effect);
        
        this.gameState.skill2Cooldown = CONFIG.SKILLS.SHIELD.COOLDOWN;
    }

    preGenerateLevel() {
        // 使用第一关配置
        const levelConfig = LEVEL_CONFIG.LEVEL_1;
        
        console.log(`预生成关卡: ${levelConfig.name}`);
        console.log(`总长度: ${levelConfig.totalLength}`);
        console.log(`段数: ${levelConfig.segments.length}`);
        
        // 统计总怪物数量
        let totalEnemies = 0;
        levelConfig.segments.forEach(segment => {
            totalEnemies += segment.enemies.length;
        });
        
        console.log(`关卡总怪物数: ${totalEnemies}`);
        
        // 预生成所有敌人
        levelConfig.segments.forEach((segment, segmentIndex) => {
            console.log(`生成第${segmentIndex + 1}段敌人: ${segment.enemies.length}个`);
            
            segment.enemies.forEach((enemyData, enemyIndex) => {
                const enemy = new Enemy(enemyData.x, enemyData.y, enemyData.type);
                this.gameObjects.enemies.push(enemy);
                console.log(`  敌人${enemyIndex + 1}: 位置(${enemyData.x}, ${enemyData.y})`);
            });
            
            // 预生成所有障碍物
            segment.obstacles.forEach((obstacleData, obstacleIndex) => {
                const obstacle = new Obstacle(obstacleData.x, obstacleData.y, obstacleData.type);
                this.gameObjects.obstacles.push(obstacle);
                console.log(`  障碍物${obstacleIndex + 1}: 位置(${obstacleData.x}, ${obstacleData.y})`);
            });
        });
        
        console.log(`预生成完成! 总敌人数: ${this.gameObjects.enemies.length}, 总障碍物数: ${this.gameObjects.obstacles.length}`);
        
        // 调试：显示所有怪物的位置
        this.gameObjects.enemies.forEach((enemy, index) => {
            console.log(`怪物${index + 1}: 位置(${enemy.x}, ${enemy.y})`);
        });
    }

    generateBackgroundSegments() {
        // 获取当前镜头位置
        const cameraY = this.camera.y;
        const segmentHeight = CONFIG.LEVEL.SEGMENT_LENGTH;
        
        // 计算需要的背景段范围
        const minY = cameraY - this.canvas.height - segmentHeight;
        const maxY = cameraY + this.canvas.height + segmentHeight;
        
        // 检查是否需要生成新的背景段
        const existingSegments = this.gameObjects.backgroundSegments.map(seg => seg.y);
        const minExistingY = Math.min(...existingSegments);
        const maxExistingY = Math.max(...existingSegments);
        
        // 在顶部添加新的背景段
        if (minExistingY > minY) {
            const newSegmentY = minExistingY - segmentHeight;
            const segment = new BackgroundSegment(newSegmentY, 'normal');
            this.gameObjects.backgroundSegments.push(segment);
            console.log(`生成新背景段: Y=${newSegmentY}`);
        }
        
        // 在底部添加新的背景段
        if (maxExistingY < maxY) {
            const newSegmentY = maxExistingY + segmentHeight;
            const segment = new BackgroundSegment(newSegmentY, 'normal');
            this.gameObjects.backgroundSegments.push(segment);
            console.log(`生成新背景段: Y=${newSegmentY}`);
        }
        
        // 清理远离镜头的背景段
        this.gameObjects.backgroundSegments = this.gameObjects.backgroundSegments.filter(segment => {
            const distanceFromCamera = Math.abs(segment.y - cameraY);
            if (distanceFromCamera > this.canvas.height * 3) {
                console.log(`清理远离的背景段: Y=${segment.y}, 距离=${distanceFromCamera.toFixed(1)}`);
                return false;
            }
            return true;
        });
    }

    checkCollisions() {
        // 玩家子弹 vs 敌人
        this.gameObjects.bullets.forEach(bullet => {
            if (bullet.owner === 'player') {
                this.gameObjects.enemies.forEach(enemy => {
                    const distance = Math.sqrt(
                        Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2)
                    );
                    const collisionDistance = bullet.size + enemy.collisionSize;
                    
                    // 调试信息：打印碰撞检测
                    if (distance < collisionDistance + 20) { // 扩大检测范围用于调试
                        console.log(`子弹碰撞检测: 距离=${distance.toFixed(1)}, 碰撞距离=${collisionDistance}, 子弹伤害=${bullet.damage}, 敌人血量=${enemy.hp}`);
                    }
                    
                    if (distance < collisionDistance + 10) { // 增加10像素容错
                        console.log(`子弹命中敌人! 造成${bullet.damage}点伤害`);
                        enemy.takeDamage(bullet.damage, this.gameState, this.gameObjects);
                        
                        bullet.destroy();
                    }
                });
                
                // 玩家子弹 vs 障碍物
                this.gameObjects.obstacles.forEach(obstacle => {
                    const distance = Math.sqrt(
                        Math.pow(bullet.x - obstacle.x, 2) + Math.pow(bullet.y - obstacle.y, 2)
                    );
                    if (distance < bullet.size + obstacle.size) {
                        obstacle.takeDamage(bullet.damage);
                        bullet.destroy();
                    }
                });
            }
        });
        
        // 敌人子弹 vs 玩家
        this.gameObjects.enemyBullets.forEach(bullet => {
            if (bullet.owner === 'enemy') {
                const distance = Math.sqrt(
                    Math.pow(bullet.x - this.gameObjects.player.x, 2) + Math.pow(bullet.y - this.gameObjects.player.y, 2)
                );
                if (distance < bullet.size + this.gameObjects.player.collisionSize) {
                    const gameOver = this.gameObjects.player.takeDamage(bullet.damage, this.gameState);
                    if (gameOver) {
                        this.gameOver(false);
                        return;
                    }
                    bullet.destroy();
                }
            }
        });
        
        // 玩家 vs 敌人
        this.gameObjects.enemies.forEach(enemy => {
            const distance = Math.sqrt(
                Math.pow(this.gameObjects.player.x - enemy.x, 2) + Math.pow(this.gameObjects.player.y - enemy.y, 2)
            );
            if (distance < this.gameObjects.player.collisionSize + enemy.collisionSize) {
                const damage = CONFIG.ENEMIES.SMALL_ENEMY.DAMAGE;
                const gameOver = this.gameObjects.player.takeDamage(damage, this.gameState, enemy.id);
                if (gameOver) {
                    this.gameOver(false);
                    return;
                }
            }
        });
        
        // 玩家 vs 障碍物
        this.gameObjects.obstacles.forEach(obstacle => {
            const distance = Math.sqrt(
                Math.pow(this.gameObjects.player.x - obstacle.x, 2) + Math.pow(this.gameObjects.player.y - obstacle.y, 2)
            );
            if (distance < this.gameObjects.player.collisionSize + obstacle.size) {
                const gameOver = this.gameObjects.player.takeDamage(obstacle.damage, this.gameState);
                if (gameOver) {
                    this.gameOver(false);
                    return;
                }
            }
        });
    }

    removeBullet(bullet) {
        const index = this.gameObjects.bullets.indexOf(bullet);
        if (index > -1) {
            this.gameObjects.bullets.splice(index, 1);
        }
    }

    removeEnemyBullet(bullet) {
        const index = this.gameObjects.enemyBullets.indexOf(bullet);
        if (index > -1) {
            this.gameObjects.enemyBullets.splice(index, 1);
        }
    }


    gameOver(victory) {
        this.gameState.isRunning = false;
        this.uiManager.showGameOver(victory, this.gameState);
    }

    update(deltaTime) {
        if (!this.gameState.isRunning) return;
        
        // 更新游戏状态
        this.gameState.currentDistance += CONFIG.GAME.FORWARD_SPEED * deltaTime;
        
        // 更新镜头位置，跟随主角移动，保持主角在屏幕下方
        this.camera.y = this.gameObjects.player.y - (this.canvas.height - 100);
        
        // 更新冷却时间
        if (this.gameState.skill1Cooldown > 0) {
            this.gameState.skill1Cooldown -= deltaTime;
        }
        if (this.gameState.skill2Cooldown > 0) {
            this.gameState.skill2Cooldown -= deltaTime;
        }
        
        // 检查护盾状态
        if (this.gameState.shieldActive && Date.now() > this.gameState.shieldEndTime) {
            this.gameState.shieldActive = false;
        }
        
        // 更新游戏对象
        const input = this.inputHandler.getInput();
        this.gameObjects.player.update(deltaTime, input, this.gameObjects, this.canvas);
        
        // 处理技能输入
        if (input.skill1) {
            this.useSkill1();
        }
        if (input.skill2) {
            this.useSkill2();
        }
        
        this.gameObjects.bullets.forEach(bullet => bullet.update(deltaTime, this.canvas));
        this.gameObjects.enemyBullets.forEach(bullet => bullet.update(deltaTime, this.canvas));
        
        // 清理标记为删除的子弹
        this.gameObjects.bullets = this.gameObjects.bullets.filter(bullet => !bullet.shouldDestroy);
        this.gameObjects.enemyBullets = this.gameObjects.enemyBullets.filter(bullet => !bullet.shouldDestroy);
        this.gameObjects.enemies.forEach(enemy => enemy.update(deltaTime, this.gameObjects));
        this.gameObjects.obstacles.forEach(obstacle => obstacle.update(deltaTime));
        this.gameObjects.particles.forEach(particle => {
            if (particle.update.length > 1) {
                // SkillEffect需要额外参数
                particle.update(deltaTime, this.gameObjects, this.gameState);
            } else {
                // 普通粒子
                particle.update(deltaTime);
            }
        });
        
        // 清理标记为删除的对象
        const enemiesBefore = this.gameObjects.enemies.length;
        this.gameObjects.enemies = this.gameObjects.enemies.filter(enemy => {
            if (enemy.shouldDestroy) {
                // 延迟清理死亡的敌人，让玩家看到死亡效果
                if (enemy.isDead && Date.now() - enemy.deathTime > 1000) { // 1秒后清理
                    console.log(`清理死亡敌人: ID=${enemy.id}, 血量=${enemy.hp}`);
                    return false;
                }
                return true; // 暂时保留，等待延迟清理
            }
            return true;
        });
        const enemiesAfter = this.gameObjects.enemies.length;
        if (enemiesBefore !== enemiesAfter) {
            console.log(`敌人数量变化: ${enemiesBefore} -> ${enemiesAfter}`);
        }
        
        this.gameObjects.obstacles = this.gameObjects.obstacles.filter(obstacle => !obstacle.shouldDestroy);
        this.gameObjects.particles = this.gameObjects.particles.filter(particle => !particle.shouldDestroy);
        
        // 清理移出屏幕的敌人和障碍物（考虑镜头偏移）
        this.gameObjects.enemies = this.gameObjects.enemies.filter(enemy => {
            // 计算敌人在屏幕上的实际位置
            const screenY = enemy.y - this.camera.y;
            // 如果敌人移出屏幕底部（主角已经经过），删除它
            if (screenY > this.canvas.height + 200) {
                console.log(`清理移出屏幕的敌人: 世界坐标(${enemy.y.toFixed(1)}), 屏幕坐标(${screenY.toFixed(1)})`);
                return false;
            }
            return true;
        });
        
        this.gameObjects.obstacles = this.gameObjects.obstacles.filter(obstacle => {
            // 计算障碍物在屏幕上的实际位置
            const screenY = obstacle.y - this.camera.y;
            // 如果障碍物移出屏幕底部（主角已经经过），删除它
            if (screenY > this.canvas.height + 200) {
                console.log(`清理移出屏幕的障碍物: 世界坐标(${obstacle.y.toFixed(1)}), 屏幕坐标(${screenY.toFixed(1)})`);
                return false;
            }
            return true;
        });
        this.gameObjects.backgroundSegments.forEach(segment => segment.update(deltaTime));
        
        // 动态生成背景段，确保始终有足够的背景覆盖
        this.generateBackgroundSegments();
        
        // 所有敌人和障碍物都已预先生成，无需动态生成
        
        // 调试信息：每10%进度打印一次敌人数量和位置
        const progress = Math.floor(this.gameState.currentDistance / CONFIG.LEVEL.TOTAL_LENGTH * 100);
        if (progress % 10 === 0 && progress > 0) {
            console.log(`进度${progress}%: 敌人数量=${this.gameObjects.enemies.length}, 障碍物数量=${this.gameObjects.obstacles.length}`);
            console.log(`主角位置: (${this.gameObjects.player.x.toFixed(1)}, ${this.gameObjects.player.y.toFixed(1)}), 镜头位置: ${this.camera.y.toFixed(1)}`);
            
            // 显示前5个敌人的位置和屏幕坐标
            const visibleEnemies = this.gameObjects.enemies.slice(0, 5);
            visibleEnemies.forEach((enemy, index) => {
                const screenY = enemy.y - this.camera.y;
                console.log(`  敌人${index + 1}: 世界坐标(${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}), 屏幕坐标(${enemy.x.toFixed(1)}, ${screenY.toFixed(1)}), 死亡=${enemy.isDead}`);
            });
        }
        
        
        // 碰撞检测
        this.checkCollisions();
        
        // 检查胜利条件
        if (this.gameState.currentDistance >= CONFIG.LEVEL.TOTAL_LENGTH) {
            this.gameOver(true);
            return;
        }
    }

    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 保存画布状态
        this.ctx.save();
        
        // 应用镜头偏移
        this.ctx.translate(0, -this.camera.y);
        
        // 绘制背景
        this.gameObjects.backgroundSegments.forEach(segment => segment.draw(this.ctx, this.canvas));
        
        // 绘制游戏对象
        this.gameObjects.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        this.gameObjects.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.gameObjects.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.gameObjects.enemyBullets.forEach(bullet => bullet.draw(this.ctx));
        this.gameObjects.particles.forEach(particle => {
            if (particle.draw.length > 1) {
                // SkillEffect需要player参数
                particle.draw(this.ctx, this.gameObjects.player);
            } else {
                // 普通粒子
                particle.draw(this.ctx);
            }
        });
        this.gameObjects.player.draw(this.ctx);
        
        // 恢复画布状态
        this.ctx.restore();
    }

    updateUI() {
        // 更新进度条
        this.uiManager.updateProgress(this.gameState.currentDistance, CONFIG.LEVEL.TOTAL_LENGTH);
        
        // 更新血条
        this.uiManager.updateHealth(this.gameState.playerHP, CONFIG.PLAYER.HP);
        
        // 更新怪物计数器 - 显示当前屏幕内的怪物数量
        this.uiManager.updateEnemyCount(this.gameObjects.enemies.length);
        
        // 更新技能按钮
        this.uiManager.updateSkillButtons(this.gameState);
        
        // 更新调试信息
        const input = this.inputHandler.getInput();
        this.uiManager.updateDebugInfo(input, this.gameObjects.player);
    }

    gameLoop(currentTime) {
        if (!this.gameState.isRunning) return;
        
        // 初始化lastTime，避免第一次运行时deltaTime过大
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 更新游戏逻辑
        this.update(deltaTime);
        
        // 渲染
        this.render();
        
        // 更新UI
        this.updateUI();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    startGame() {
        this.uiManager.hideStartScreen();
        this.initGame();
        this.start();
    }

    start() {
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine };
}
