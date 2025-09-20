// 重新设计的游戏引擎 - 清晰简洁的架构

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 输入处理
        this.inputHandler = new InputHandler(canvas);
        this.uiManager = new UIManager();
        
        // 游戏状态
        this.gameState = {
            isRunning: false,
            currentDistance: 0,
            playerHP: CONFIG.PLAYER.HP,
            enemiesKilled: 0,
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
            enemies: [],
            obstacles: [],
            particles: [],
            backgroundSegments: []
        };
        
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = CONFIG.LEVEL.GAME_WIDTH;
        this.canvas.height = window.innerHeight * 0.8;
        this.canvas.style.margin = '0 auto';
        this.canvas.style.display = 'block';
    }

    initGame() {
        this.resizeCanvas();
        
        // 重置游戏状态
        this.gameState = {
            isRunning: true,
            currentDistance: 0,
            playerHP: CONFIG.PLAYER.HP,
            enemiesKilled: 0,
            skill1Cooldown: 0,
            skill2Cooldown: 0,
            shieldActive: false,
            shieldEndTime: 0
        };
        
        // 清空游戏对象
        this.gameObjects = {
            player: new Player(this.canvas),
            bullets: [],
            enemies: [],
            obstacles: [],
            particles: [],
            backgroundSegments: []
        };
        
        // 初始化背景段
        this.initBackgroundSegments();
        
        // 预生成所有怪物和障碍物
        this.preGenerateLevel();
        
        // 隐藏游戏结束界面
        this.uiManager.hideGameOver();
        
        // 更新UI
        this.updateUI();
        
        // 开始游戏循环
        this.start();
    }

    initBackgroundSegments() {
        // 生成足够的背景段覆盖整个游戏范围
        const segmentHeight = CONFIG.LEVEL.SEGMENT_LENGTH;
        const totalSegments = Math.ceil(CONFIG.LEVEL.TOTAL_LENGTH / segmentHeight) + 4; // 额外4个段
        
        for (let i = 0; i < totalSegments; i++) {
            const segment = new BackgroundSegment(i * segmentHeight, 'normal');
            this.gameObjects.backgroundSegments.push(segment);
        }
    }

    preGenerateLevel() {
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
    }

    update(deltaTime) {
        if (!this.gameState.isRunning) return;
        
        // 更新游戏状态
        this.gameState.currentDistance += CONFIG.GAME.FORWARD_SPEED * deltaTime;
        
        // 更新镜头位置，跟随主角移动
        this.camera.y = this.gameObjects.player.y - (this.canvas.height - 100);
        
        // 更新冷却时间
        if (this.gameState.skill1Cooldown > 0) {
            this.gameState.skill1Cooldown -= deltaTime;
        }
        if (this.gameState.skill2Cooldown > 0) {
            this.gameState.skill2Cooldown -= deltaTime;
        }
        
        // 更新护盾状态
        if (this.gameState.shieldActive && Date.now() > this.gameState.shieldEndTime) {
            this.gameState.shieldActive = false;
        }
        
        // 更新游戏对象
        this.gameObjects.player.update(deltaTime, this.inputHandler.input, this.gameObjects, this.canvas);
        
        // 更新子弹
        this.gameObjects.bullets.forEach(bullet => bullet.update(deltaTime, this.canvas));
        
        // 更新敌人
        this.gameObjects.enemies.forEach(enemy => enemy.update(deltaTime, this.gameObjects, this.canvas));
        
        // 更新障碍物
        this.gameObjects.obstacles.forEach(obstacle => obstacle.update(deltaTime, this.canvas));
        
        // 更新粒子效果
        this.gameObjects.particles.forEach(particle => {
            if (particle.update.length > 1) {
                particle.update(deltaTime, this.gameObjects, this.gameState, this.gameObjects.player);
            } else {
                particle.update(deltaTime);
            }
        });
        
        // 更新背景段
        this.gameObjects.backgroundSegments.forEach(segment => segment.update(deltaTime));
        
        // 清理标记为删除的对象
        this.cleanupObjects();
        
        // 碰撞检测
        this.checkCollisions();
        
        // 检查游戏结束条件
        this.checkGameEnd();
        
        // 更新UI
        this.updateUI();
    }

    cleanupObjects() {
        // 清理子弹
        this.gameObjects.bullets = this.gameObjects.bullets.filter(bullet => !bullet.shouldDestroy);
        
        // 清理敌人
        this.gameObjects.enemies = this.gameObjects.enemies.filter(enemy => {
            if (enemy.shouldDestroy) {
                // 延迟清理死亡的敌人
                if (enemy.isDead && Date.now() - enemy.deathTime > 1000) {
                    return false;
                }
                return true;
            }
            return true;
        });
        
        // 清理障碍物
        this.gameObjects.obstacles = this.gameObjects.obstacles.filter(obstacle => !obstacle.shouldDestroy);
        
        // 清理粒子效果
        this.gameObjects.particles = this.gameObjects.particles.filter(particle => !particle.shouldDestroy);
    }

    checkCollisions() {
        // 玩家子弹 vs 敌人
        this.gameObjects.bullets.forEach(bullet => {
            if (bullet.owner === 'player') {
                this.gameObjects.enemies.forEach(enemy => {
                    if (!enemy.isDead) {
                        const distance = Math.sqrt(
                            Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2)
                        );
                        const collisionDistance = bullet.size + enemy.collisionSize;
                        
                        if (distance < collisionDistance + 10) {
                            enemy.takeDamage(bullet.damage, this.gameState, this.gameObjects);
                            bullet.destroy();
                        }
                    }
                });
            }
        });
        
        // 玩家 vs 敌人
        this.gameObjects.enemies.forEach(enemy => {
            if (!enemy.isDead) {
                const distance = Math.sqrt(
                    Math.pow(this.gameObjects.player.x - enemy.x, 2) + 
                    Math.pow(this.gameObjects.player.y - enemy.y, 2)
                );
                
                if (distance < this.gameObjects.player.collisionSize + enemy.collisionSize) {
                    this.gameObjects.player.takeDamage(enemy.damage, this.gameState, enemy.id);
                }
            }
        });
        
        // 玩家 vs 障碍物
        this.gameObjects.obstacles.forEach(obstacle => {
            const distance = Math.sqrt(
                Math.pow(this.gameObjects.player.x - obstacle.x, 2) + 
                Math.pow(this.gameObjects.player.y - obstacle.y, 2)
            );
            
            if (distance < this.gameObjects.player.collisionSize + obstacle.size) {
                this.gameObjects.player.takeDamage(obstacle.damage, this.gameState);
            }
        });
    }

    checkGameEnd() {
        if (this.gameObjects.player.hp <= 0) {
            this.gameOver(false);
            return;
        }
        
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
        this.gameObjects.particles.forEach(particle => {
            if (particle.draw.length > 1) {
                particle.draw(this.ctx, this.gameObjects.player);
            } else {
                particle.draw(this.ctx);
            }
        });
        this.gameObjects.player.draw(this.ctx);
        
        // 恢复画布状态
        this.ctx.restore();
    }

    updateUI() {
        this.uiManager.updateProgress(this.gameState.currentDistance, CONFIG.LEVEL.TOTAL_LENGTH);
        this.uiManager.updateHealth(this.gameObjects.player.hp, CONFIG.PLAYER.HP);
        this.uiManager.updateEnemyCount(this.gameObjects.enemies.length);
        this.uiManager.updateSkillButtons(this.gameState);
    }

    gameOver(isWin) {
        this.gameState.isRunning = false;
        this.gameState.isGameWon = isWin;
        
        if (isWin) {
            this.uiManager.showGameOver(true, this.gameState.enemiesKilled, this.gameObjects.player.hp);
        } else {
            this.uiManager.showGameOver(false, this.gameState.enemiesKilled, this.gameObjects.player.hp);
        }
        
        this.stop();
    }

    start() {
        if (this.gameState.isRunning) {
            this.gameLoop();
        }
    }

    stop() {
        this.gameState.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    gameLoop(currentTime = 0) {
        if (!this.gameState.isRunning) return;
        
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine };
}


