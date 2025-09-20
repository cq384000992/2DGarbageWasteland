// 末日垃圾场游戏配置文件

const CONFIG = {
    // 主角属性
    PLAYER: {
        HP: 200, // 增加血量，从100改为200
        MOVE_SPEED: 300,
        BASE_ATTACK: 10,
        ATTACK_INTERVAL: 0.3, // 更快的攻击速度，适合割草
        SIZE: 75, // 主角150像素宽度的一半
        COLLISION_SIZE: 100, // 200像素碰撞的一半
        DAMAGE_COOLDOWN: 2000 // 伤害间隔2秒
    },
    
    // 关卡设置
    LEVEL: {
        TOTAL_LENGTH: 5000,
        SEGMENT_LENGTH: 500,
        GAME_WIDTH: 600 // 固定游戏宽度
    },
    
    // 技能设置
    SKILLS: {
        MAGNETIC_BOMB: {
            COOLDOWN: 8,
            DAMAGE: 50,
            RADIUS: 100,
            DURATION: 2000
        },
        SHIELD: {
            COOLDOWN: 10,
            DURATION: 3000,
            RADIUS: 50
        }
    },
    
    // 敌人设置
    ENEMIES: {
        SMALL_ENEMY: {
            HP: 5, // 血量很少，适合割草
            DAMAGE: 5, // 降低伤害，从10改为5
            COLOR: '#8B4513',
            SIZE: 75, // 150像素宽度的一半
            COLLISION_SIZE: 100, // 200像素碰撞的一半
            SHOOT_INTERVAL: 0 // 不射击，只近战
        }
    },
    
    // 障碍物设置
    OBSTACLES: {
        PILE: {
            DAMAGE: 8, // 降低伤害，从15改为8
            HP: 20,
            COLOR: '#654321',
            SIZE: 30,
            DESTROYABLE: true
        },
        HOLE: {
            DAMAGE: 10, // 降低伤害，从20改为10
            HP: Infinity,
            COLOR: '#333333',
            SIZE: 30,
            DESTROYABLE: false
        }
    },
    
    // 子弹设置
    BULLETS: {
        PLAYER: {
            SPEED: 400,
            SIZE: 4,
            COLOR: '#ffff00',
            LIFE: 2000 // 缩短生命周期，2秒后自动销毁
        },
        ENEMY: {
            SPEED: 250,
            SIZE: 4,
            COLOR: '#ff0000',
            LIFE: 2000 // 缩短生命周期，2秒后自动销毁
        }
    },
    
    // 游戏设置
    GAME: {
        BACKGROUND_SPEED: 120, // 提速20%
        FORWARD_SPEED: 120, // 提速20%
        PARTICLE_COUNT: 8,
        PARTICLE_LIFE: 1000
    }
};

// 导出配置（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
