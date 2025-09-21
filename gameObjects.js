// 游戏对象类定义

// 基础游戏对象类
class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.active = true;
        this.color = '#FFFFFF';
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // 边界检查：如果超出屏幕底部，销毁（子弹类会重写此方法）
        if (this.y > CONFIG.GAME.CANVAS_HEIGHT) {
            this.destroy();
        }
        
        // 限制在活动区域内（子弹不需要此限制）
        this.checkPlayAreaBounds();
    }
    
    // 限制在活动区域内的边界检查
    checkPlayAreaBounds() {
        const playAreaLeft = (CONFIG.GAME.CANVAS_WIDTH - 720) / 2; // 360
        const playAreaRight = playAreaLeft + 720; // 1080
        
        if (this.x < playAreaLeft) {
            this.x = playAreaLeft;
            this.velocityX = 0;
        } else if (this.x + this.width > playAreaRight) {
            this.x = playAreaRight - this.width;
            this.velocityX = 0;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    checkCollision(other) {
        const bounds1 = this.getBounds();
        const bounds2 = other.getBounds();
        
        return bounds1.left < bounds2.right &&
               bounds1.right > bounds2.left &&
               bounds1.top < bounds2.bottom &&
               bounds1.bottom > bounds2.top;
    }

    destroy() {
        this.active = false;
    }
}

// 玩家类
class Player extends GameObject {
    constructor(x, y, imageLoader) {
        super(x, y, CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT);
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
        this.moveSpeed = CONFIG.PLAYER.MOVE_SPEED;
        this.shootInterval = CONFIG.PLAYER.SHOOT_INTERVAL;
        this.lastShotTime = 0;
        this.color = CONFIG.PLAYER.COLOR;
        this.invincible = false;
        this.invincibilityTime = 0;
        this.direction = 1; // 1为右，-1为左
        
        // 精灵动画
        this.imageLoader = imageLoader;
        this.animation = new SpriteAnimation(
            imageLoader, 
            CONFIG.PLAYER.ANIMATION.FRAMES, 
            CONFIG.PLAYER.ANIMATION.FRAME_DURATION
        );
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // 更新动画
        if (this.animation) {
            this.animation.update(deltaTime);
        }
        
        // 处理无敌时间
        if (this.invincible) {
            this.invincibilityTime -= deltaTime;
            if (this.invincibilityTime <= 0) {
                this.invincible = false;
            }
        }
        
        // 边界检查：限制在中间720像素范围内
        const playAreaLeft = (CONFIG.GAME.CANVAS_WIDTH - 720) / 2; // 360
        const playAreaRight = playAreaLeft + 720; // 1080
        
        if (this.x < playAreaLeft) {
            this.x = playAreaLeft;
            this.velocityX = 0;
        } else if (this.x + this.width > playAreaRight) {
            this.x = playAreaRight - this.width;
            this.velocityX = 0;
        }
        
        // 玩家不能超出屏幕底部
        if (this.y + this.height > CONFIG.GAME.CANVAS_HEIGHT) {
            this.y = CONFIG.GAME.CANVAS_HEIGHT - this.height;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        // 无敌时闪烁效果
        if (this.invincible && Math.floor(Date.now() / 100) % 2) {
            return;
        }
        
        // 使用精灵动画绘制
        if (this.animation && this.imageLoader) {
            const sprite = this.animation.getCurrentFrame();
            if (sprite) {
                // 根据方向翻转精灵
                ctx.save();
                if (this.direction === -1) {
                    ctx.scale(-1, 1);
                    ctx.drawImage(sprite, -(this.x + this.width), this.y, this.width, this.height);
                } else {
                    ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
                }
                ctx.restore();
                return;
            }
        }
        
        // 如果精灵未加载，使用原始绘制方式
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制玩家细节
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 50, this.y + 50, 30, 30); // 左眼
        ctx.fillRect(this.x + 200, this.y + 50, 30, 30); // 右眼
        
        // 绘制嘴巴
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 100, this.y + 150, 80, 20);
        
        // 绘制武器
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 180, this.y - 20, 40, 40);
        
        // 绘制手臂
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(this.x - 20, this.y + 100, 20, 200);
        ctx.fillRect(this.x + this.width, this.y + 100, 20, 200);
    }

    moveLeft() {
        this.velocityX = -this.moveSpeed;
        this.direction = -1;
    }

    moveRight() {
        this.velocityX = this.moveSpeed;
        this.direction = 1;
    }

    stopMoving() {
        this.velocityX = 0;
    }

    // 自动移动（固定速度向上）
    autoMove() {
        this.velocityY = -this.moveSpeed * 0.5; // 以一半速度自动向上移动
    }

    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime >= this.shootInterval) {
            this.lastShotTime = currentTime;
            if (CONFIG.DEBUG.ENABLED) {
                console.log(`射击: 间隔=${currentTime - (this.lastShotTime - this.shootInterval)}, 目标间隔=${this.shootInterval}, 当前时间=${currentTime}, 上次射击=${this.lastShotTime}`);
            }
            return new Bullet(
                this.x + this.width / 2 - CONFIG.PLAYER.BULLET_WIDTH / 2,
                this.y - CONFIG.PLAYER.BULLET_HEIGHT, // 子弹在玩家上方创建
                0, // 子弹水平速度固定为0，不受主角移动影响
                -CONFIG.PLAYER.BULLET_SPEED, // 子弹垂直速度固定向上，不受主角移动影响
                CONFIG.PLAYER.BULLET_DAMAGE,
                'player'
            );
        }
        return null;
    }

    takeDamage(damage) {
        if (this.invincible) return false;
        
        this.health -= damage;
        this.invincible = true;
        this.invincibilityTime = CONFIG.BALANCE.INVINCIBILITY_TIME / 1000; // 转换为秒
        
        if (this.health <= 0) {
            this.health = 0;
            this.destroy();
        }
        
        return true;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
}

// 子弹类
class Bullet extends GameObject {
    constructor(x, y, velocityX, velocityY, damage, owner) {
        super(x, y, CONFIG.PLAYER.BULLET_WIDTH, CONFIG.PLAYER.BULLET_HEIGHT);
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.damage = damage;
        this.owner = owner; // 'player' 或 'enemy'
        
        // 记录子弹的初始位置，用于计算射程
        this.initialX = x;
        this.initialY = y;
        
        if (owner === 'player') {
            this.color = CONFIG.BULLETS.PLAYER_BULLET.COLOR;
        } else {
            this.color = CONFIG.BULLETS.ENEMY_BULLET.COLOR;
            this.width = CONFIG.BULLETS.ENEMY_BULLET.WIDTH;
            this.height = CONFIG.BULLETS.ENEMY_BULLET.HEIGHT;
        }
    }

    update(deltaTime) {
        // 子弹不需要调用父类的update，避免不必要的边界检查
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // 检查是否超出屏幕边界
        // 玩家子弹向上移动，基于初始位置计算射程
        const maxFlightTime = 2.0; // 2秒
        const maxFlightDistance = CONFIG.PLAYER.BULLET_SPEED * maxFlightTime; // 4800像素
        
        // 基于子弹初始位置计算射程边界
        const maxY = this.initialY - maxFlightDistance;
        
        if (this.y < maxY ||  // 子弹超出射程边界时销毁（从初始位置向上4800像素）
            this.y > CONFIG.GAME.CANVAS_HEIGHT + 1000 ||  // 子弹超出屏幕下边界1000像素时销毁
            this.x + this.width < -1000 ||  // 子弹超出屏幕左边界1000像素时销毁
            this.x > CONFIG.GAME.CANVAS_WIDTH + 1000) {  // 子弹超出屏幕右边界1000像素时销毁
            if (CONFIG.DEBUG.ENABLED && this.owner === 'player') {
                console.log(`子弹超出边界销毁: 位置(${this.x.toFixed(1)}, ${this.y.toFixed(1)}), 初始位置(${this.initialY.toFixed(1)}), 边界: ${maxY.toFixed(1)}, 射程: ${maxFlightTime}秒`);
            }
            this.destroy();
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 添加发光效果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
        
        // 添加子弹细节
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
    }
}

// 敌人基类
class Enemy extends GameObject {
    constructor(x, y, width, height, health, damage, color) {
        super(x, y, width, height);
        this.health = health;
        this.maxHealth = health;
        this.damage = damage;
        this.color = color;
        this.lastAttackTime = 0;
        this.invincible = true; // 默认无敌状态
        this.invincibleDistance = CONFIG.BALANCE.MONSTER_INVINCIBLE_DISTANCE; // 无敌距离
    }

    // 检查是否应该处于无敌状态
    checkInvincibility(player) {
        if (!player || !player.active) {
            this.invincible = true;
            return;
        }
        
        // 计算与玩家的距离
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离大于无敌距离，则无敌；否则解除无敌
        this.invincible = distance > this.invincibleDistance;
    }

    takeDamage(damage) {
        // 如果处于无敌状态，不受伤害
        if (this.invincible) {
            return false;
        }
        
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
            return true; // 敌人死亡
        }
        return false;
    }

    canAttack() {
        const currentTime = Date.now();
        return currentTime - this.lastAttackTime >= this.getAttackCooldown(); // 已经是毫秒
    }

    getAttackCooldown() {
        return 1000; // 默认1秒
    }
}

// 油桶喷射怪
class BarrelMonster extends Enemy {
    constructor(x, y, imageLoader) {
        super(x, y, CONFIG.ENEMIES.BARREL_MONSTER.WIDTH, CONFIG.ENEMIES.BARREL_MONSTER.HEIGHT,
              CONFIG.ENEMIES.BARREL_MONSTER.HEALTH, CONFIG.ENEMIES.BARREL_MONSTER.DAMAGE,
              CONFIG.ENEMIES.BARREL_MONSTER.COLOR);
        this.moveSpeed = CONFIG.ENEMIES.BARREL_MONSTER.MOVE_SPEED;
        this.attackRange = CONFIG.ENEMIES.BARREL_MONSTER.ATTACK_RANGE;
        this.imageLoader = imageLoader;
        this.spriteName = CONFIG.ENEMIES.BARREL_MONSTER.SPRITE;
    }

    update(deltaTime, player) {
        super.update(deltaTime);
        
        // 检查无敌状态
        this.checkInvincibility(player);
        
        // 怪物相对静止，不主动移动
        this.velocityY = 0;
        this.velocityX = 0;
        
        // 如果接近玩家，尝试攻击
        // 怪物完全静止，不移动
        // 移除所有移动逻辑
        
        // 边界检查：如果超出屏幕底部，销毁
        if (this.y > CONFIG.GAME.CANVAS_HEIGHT) {
            this.destroy();
        }
        
        // 限制在活动区域内
        this.checkPlayAreaBounds();
    }

    draw(ctx) {
        if (!this.active) return;
        
        // 无敌状态时添加半透明效果
        if (this.invincible) {
            ctx.globalAlpha = 0.5;
        }
        
        // 使用精灵绘制
        if (this.imageLoader && this.spriteName) {
            const sprite = this.imageLoader.getImage(this.spriteName);
            if (sprite) {
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
                
                // 绘制生命值条
                if (this.health < this.maxHealth) {
                    const barWidth = this.width;
                    const barHeight = 6;
                    const healthPercent = this.health / this.maxHealth;
                    
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(this.x, this.y - 12, barWidth, barHeight);
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(this.x, this.y - 12, barWidth * healthPercent, barHeight);
                }
                
                // 恢复透明度
                ctx.globalAlpha = 1.0;
                return;
            }
        }
        
        // 如果精灵未加载，使用原始绘制方式
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制油桶细节
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 30, this.y + 30, this.width - 60, 60);
        
        // 绘制眼睛
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 50, this.y + 100, 20, 20);
        ctx.fillRect(this.x + 150, this.y + 100, 20, 20);
        
        // 绘制嘴巴
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 100, this.y + 200, 50, 20);
        
        // 绘制生命值条
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 6;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x, this.y - 12, barWidth, barHeight);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x, this.y - 12, barWidth * healthPercent, barHeight);
        }
    }

    getAttackCooldown() {
        return CONFIG.ENEMIES.BARREL_MONSTER.ATTACK_COOLDOWN; // 保持毫秒
    }
}

// 巨型近战怪
class GiantMelee extends Enemy {
    constructor(x, y, imageLoader) {
        super(x, y, CONFIG.ENEMIES.GIANT_MELEE.WIDTH, CONFIG.ENEMIES.GIANT_MELEE.HEIGHT,
              CONFIG.ENEMIES.GIANT_MELEE.HEALTH, CONFIG.ENEMIES.GIANT_MELEE.DAMAGE,
              CONFIG.ENEMIES.GIANT_MELEE.COLOR);
        this.moveSpeed = CONFIG.ENEMIES.GIANT_MELEE.MOVE_SPEED;
        this.attackRange = CONFIG.ENEMIES.GIANT_MELEE.ATTACK_RANGE;
        this.imageLoader = imageLoader;
        this.spriteName = CONFIG.ENEMIES.GIANT_MELEE.SPRITE;
    }

    update(deltaTime, player) {
        super.update(deltaTime);
        
        // 检查无敌状态
        this.checkInvincibility(player);
        
        // 怪物相对静止，不主动移动
        this.velocityY = 0;
        this.velocityX = 0;
        
        // 怪物完全静止，不移动
        // 移除所有移动逻辑
        
        // 边界检查：如果超出屏幕底部，销毁
        if (this.y > CONFIG.GAME.CANVAS_HEIGHT) {
            this.destroy();
        }
        
        // 限制在活动区域内
        this.checkPlayAreaBounds();
    }

    draw(ctx) {
        if (!this.active) return;
        
        // 无敌状态时添加半透明效果
        if (this.invincible) {
            ctx.globalAlpha = 0.5;
        }
        
        // 使用精灵绘制
        if (this.imageLoader && this.spriteName) {
            const sprite = this.imageLoader.getImage(this.spriteName);
            if (sprite) {
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
                
                // 绘制生命值条
                if (this.health < this.maxHealth) {
                    const barWidth = this.width;
                    const barHeight = 8;
                    const healthPercent = this.health / this.maxHealth;
                    
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(this.x, this.y - 15, barWidth, barHeight);
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(this.x, this.y - 15, barWidth * healthPercent, barHeight);
                }
                
                // 恢复透明度
                ctx.globalAlpha = 1.0;
                return;
            }
        }
        
        // 如果精灵未加载，使用原始绘制方式
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制细节
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 50, this.y + 50, 50, 50); // 左眼
        ctx.fillRect(this.x + 200, this.y + 50, 50, 50); // 右眼
        
        // 绘制嘴巴
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 100, this.y + 200, 150, 30);
        
        // 绘制手臂
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x - 50, this.y + 100, 50, 200);
        ctx.fillRect(this.x + this.width, this.y + 100, 50, 200);
        
        // 绘制生命值条
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 8;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x, this.y - 15, barWidth, barHeight);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x, this.y - 15, barWidth * healthPercent, barHeight);
        }
    }

    getAttackCooldown() {
        return CONFIG.ENEMIES.GIANT_MELEE.ATTACK_COOLDOWN;
    }
}

// 灯头飞碟炮塔
class UFOTurret extends Enemy {
    constructor(x, y, imageLoader) {
        super(x, y, CONFIG.ENEMIES.UFO_TURRET.WIDTH, CONFIG.ENEMIES.UFO_TURRET.HEIGHT,
              CONFIG.ENEMIES.UFO_TURRET.HEALTH, CONFIG.ENEMIES.UFO_TURRET.DAMAGE,
              CONFIG.ENEMIES.UFO_TURRET.COLOR);
        this.moveSpeed = CONFIG.ENEMIES.UFO_TURRET.MOVE_SPEED;
        this.shootInterval = CONFIG.ENEMIES.UFO_TURRET.SHOOT_INTERVAL;
        this.lastShotTime = 0;
        this.imageLoader = imageLoader;
        this.spriteName = CONFIG.ENEMIES.UFO_TURRET.SPRITE;
    }

    update(deltaTime, player) {
        super.update(deltaTime);
        
        // 检查无敌状态
        this.checkInvincibility(player);
        
        // 怪物完全静止，不移动
        this.velocityY = 0;
        this.velocityX = 0;
        
        // 边界检查：如果超出屏幕底部，销毁
        if (this.y > CONFIG.GAME.CANVAS_HEIGHT) {
            this.destroy();
        }
        
        // 限制在活动区域内
        this.checkPlayAreaBounds();
    }

    draw(ctx) {
        if (!this.active) return;
        
        // 无敌状态时添加半透明效果
        if (this.invincible) {
            ctx.globalAlpha = 0.5;
        }
        
        // 使用精灵绘制
        if (this.imageLoader && this.spriteName) {
            const sprite = this.imageLoader.getImage(this.spriteName);
            if (sprite) {
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
                
                // 绘制生命值条
                if (this.health < this.maxHealth) {
                    const barWidth = this.width;
                    const barHeight = 6;
                    const healthPercent = this.health / this.maxHealth;
                    
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(this.x, this.y - 12, barWidth, barHeight);
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(this.x, this.y - 12, barWidth * healthPercent, barHeight);
                }
                
                // 恢复透明度
                ctx.globalAlpha = 1.0;
                return;
            }
        }
        
        // 如果精灵未加载，使用原始绘制方式
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制飞碟细节
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x + 80, this.y + 40, 240, 80);
        
        // 绘制灯头
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 160, this.y + 20, 80, 40);
        
        // 绘制眼睛
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 100, this.y + 200, 30, 30);
        ctx.fillRect(this.x + 270, this.y + 200, 30, 30);
        
        // 绘制生命值条
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 6;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x, this.y - 12, barWidth, barHeight);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x, this.y - 12, barWidth * healthPercent, barHeight);
        }
    }

    shoot(player, camera) {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime >= this.shootInterval && player && player.active) {
            // 检查怪物是否在摄像机视野内
            if (camera && !camera.isInView(this.x, this.y, this.width, this.height)) {
                return null; // 不在视野内，不射击
            }
            
            this.lastShotTime = currentTime;
            
            // 计算射击方向
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const velocityX = (dx / distance) * CONFIG.ENEMIES.UFO_TURRET.BULLET_SPEED;
                const velocityY = (dy / distance) * CONFIG.ENEMIES.UFO_TURRET.BULLET_SPEED;
                
                return new Bullet(
                    this.x + this.width / 2 - CONFIG.ENEMIES.UFO_TURRET.BULLET_WIDTH / 2,
                    this.y + this.height,
                    velocityX,
                    velocityY,
                    CONFIG.ENEMIES.UFO_TURRET.DAMAGE,
                    'enemy'
                );
            }
        }
        return null;
    }
}

// 障碍物基类
class Obstacle extends GameObject {
    constructor(x, y, width, height, damage, color, destroyable = true) {
        super(x, y, width, height);
        this.damage = damage;
        this.color = color;
        this.destroyable = destroyable;
        this.health = destroyable ? 50 : Infinity;
        this.maxHealth = this.health;
    }

    takeDamage(damage) {
        if (this.destroyable) {
            this.health -= damage;
            if (this.health <= 0) {
                this.destroy();
                return true; // 障碍物被摧毁
            }
        }
        return false;
    }
}

// 废品堆
class JunkPile extends Obstacle {
    constructor(x, y) {
        super(x, y, CONFIG.OBSTACLES.JUNK_PILE.WIDTH, CONFIG.OBSTACLES.JUNK_PILE.HEIGHT,
              CONFIG.OBSTACLES.JUNK_PILE.DAMAGE, CONFIG.OBSTACLES.JUNK_PILE.COLOR,
              CONFIG.OBSTACLES.JUNK_PILE.DESTROYABLE);
        this.health = CONFIG.OBSTACLES.JUNK_PILE.HEALTH;
        this.maxHealth = this.health;
    }

    draw(ctx) {
        if (!this.active) return;
        
        // 绘制废品堆
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制废品细节
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 20, this.y + 20, 40, 40);
        ctx.fillRect(this.x + 80, this.y + 40, 30, 30);
        ctx.fillRect(this.x + 140, this.y + 30, 40, 50);
        
        // 绘制生命值条
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 6;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x, this.y - 12, barWidth, barHeight);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x, this.y - 12, barWidth * healthPercent, barHeight);
        }
    }
}


// 粒子效果类
class Particle {
    constructor(x, y, velocityX, velocityY, color, lifetime) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.color = color;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.size = Math.random() * 4 + 2;
        this.active = true;
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        this.lifetime -= deltaTime * 1000; // 转换为毫秒
        
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        const alpha = this.lifetime / this.maxLifetime;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// 粒子系统
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addExplosion(x, y, count = CONFIG.PARTICLES.EXPLOSION.COUNT) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * CONFIG.PARTICLES.EXPLOSION.SPEED + 50;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const color = CONFIG.PARTICLES.EXPLOSION.COLORS[Math.floor(Math.random() * CONFIG.PARTICLES.EXPLOSION.COLORS.length)];
            
            this.particles.push(new Particle(
                x, y, velocityX, velocityY, color, CONFIG.PARTICLES.EXPLOSION.LIFETIME
            ));
        }
    }

    addHitEffect(x, y) {
        for (let i = 0; i < CONFIG.PARTICLES.HIT.COUNT; i++) {
            const velocityX = (Math.random() - 0.5) * CONFIG.PARTICLES.HIT.SPEED;
            const velocityY = (Math.random() - 0.5) * CONFIG.PARTICLES.HIT.SPEED;
            const color = CONFIG.PARTICLES.HIT.COLORS[Math.floor(Math.random() * CONFIG.PARTICLES.HIT.COLORS.length)];
            
            this.particles.push(new Particle(
                x, y, velocityX, velocityY, color, CONFIG.PARTICLES.HIT.LIFETIME
            ));
        }
    }

    update(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.active;
        });
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
}
