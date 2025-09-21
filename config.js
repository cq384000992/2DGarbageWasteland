// 游戏配置文件
const CONFIG = {
    // 游戏基本设置
    GAME: {
        CANVAS_WIDTH: 1440,
        CANVAS_HEIGHT: 2560,
        FPS: 60,
        GRAVITY: 0.5,
        BACKGROUND_COLOR: '#0f0f23'
    },

    // 玩家设置
    PLAYER: {
        WIDTH: 267, // 400 * 2/3
        HEIGHT: 400, // 600 * 2/3
        START_X: 800, // 活动区域中央 (360 + 720/2 - 267/2)
        START_Y: 1280, // 屏幕中央 (2560/2)
        MAX_HEALTH: 100,
        MOVE_SPEED: 780, // 像素/秒 (390 * 2)
        SHOOT_INTERVAL: 833, // 毫秒 (1.2发每秒，提高一倍频率)
        BULLET_DAMAGE: 10,
        BULLET_SPEED: 2400, // 300%速度提升 (800 * 3)
        BULLET_WIDTH: 20,
        BULLET_HEIGHT: 50,
        COLOR: '#4ecdc4',
        // 精灵动画配置
        ANIMATION: {
            FRAMES: ['player_walk_01', 'player_walk_02', 'player_walk_03', 'player_walk_04'],
            FRAME_DURATION: 200 // 毫秒
        }
    },

    // 敌人设置
    ENEMIES: {
        // 油桶喷射怪
        BARREL_MONSTER: {
            WIDTH: 200, // 300 * 2/3
            HEIGHT: 300, // 450 * 2/3
            HEALTH: 10, // 1发子弹打死
            DAMAGE: 20,
            MOVE_SPEED: 100, // 增加移动速度
            COLOR: '#8B4513',
            SPAWN_RATE: 0.005, // 进一步降低生成概率
            ATTACK_RANGE: 200,
            ATTACK_COOLDOWN: 2000, // 毫秒
            SPRITE: 'monster_01'
        },
        
        // 灯头飞碟炮塔
        UFO_TURRET: {
            WIDTH: 267, // 400 * 2/3
            HEIGHT: 400, // 600 * 2/3
            HEALTH: 10, // 1发子弹打死
            DAMAGE: 10,
            MOVE_SPEED: 60, // 增加移动速度
            COLOR: '#9370DB',
            SPAWN_RATE: 0.003, // 进一步降低生成概率
            SHOOT_INTERVAL: 1500, // 毫秒
            BULLET_SPEED: 400,
            BULLET_WIDTH: 15,
            BULLET_HEIGHT: 40,
            BULLET_COLOR: '#FFD700',
            SPRITE: 'monster_02'
        },
        
        // 巨型近战怪
        GIANT_MELEE: {
            WIDTH: 333, // 500 * 2/3
            HEIGHT: 500, // 750 * 2/3
            HEALTH: 20, // 2发子弹打死
            DAMAGE: 30,
            MOVE_SPEED: 80,
            COLOR: '#8B0000',
            SPAWN_RATE: 0.001, // 极低生成概率
            ATTACK_RANGE: 250,
            ATTACK_COOLDOWN: 3000, // 毫秒
            SPRITE: 'monster_03'
        }
    },

    // 障碍物设置
    OBSTACLES: {
        // 废品堆
        JUNK_PILE: {
            WIDTH: 200,
            HEIGHT: 150,
            HEALTH: 50,
            DAMAGE: 15,
            COLOR: '#696969',
            SPAWN_RATE: 0.015,
            DESTROYABLE: true
        }
    },

    // 子弹设置
    BULLETS: {
        PLAYER_BULLET: {
            WIDTH: 20,
            HEIGHT: 50,
            SPEED: 800,
            COLOR: '#00FF00',
            DAMAGE: 10
        },
        
        ENEMY_BULLET: {
            WIDTH: 15,
            HEIGHT: 40,
            SPEED: 400,
            COLOR: '#FFD700',
            DAMAGE: 10
        }
    },

    // 关卡设置
    LEVELS: [
        {
            DURATION: 80000, // 80秒
            ENEMY_SPAWN_MULTIPLIER: 1.0,
            OBSTACLE_SPAWN_MULTIPLIER: 1.0,
            BACKGROUND_COLOR: '#0f0f23',
            MAX_BARREL_MONSTERS: 45,  // 45个油桶怪 (30 * 1.5)
            MAX_UFO_TURRETS: 24,      // 24个UFO炮塔 (16 * 1.5)
            MAX_GIANT_MELEES: 9,      // 9个巨型怪 (6 * 1.5)
            TOTAL_MONSTERS: 78,       // 总怪物数78个 (52 * 1.5)
            DIFFICULTY: '简单',
            DESCRIPTION: '新手关卡，怪物适中，节奏较慢'
        },
        {
            DURATION: 120000, // 120秒
            ENEMY_SPAWN_MULTIPLIER: 1.5,
            OBSTACLE_SPAWN_MULTIPLIER: 1.2,
            BACKGROUND_COLOR: '#1a0f23',
            MAX_BARREL_MONSTERS: 75,  // 75个油桶怪 (50 * 1.5)
            MAX_UFO_TURRETS: 45,      // 45个UFO炮塔 (30 * 1.5)
            MAX_GIANT_MELEES: 24,     // 24个巨型怪 (16 * 1.5)
            TOTAL_MONSTERS: 144,      // 总怪物数144个 (96 * 1.5)
            DIFFICULTY: '中等',
            DESCRIPTION: '进阶关卡，怪物密集，节奏加快'
        }
    ],

    // 粒子效果设置
    PARTICLES: {
        EXPLOSION: {
            COUNT: 15,
            SPEED: 200,
            LIFETIME: 1000,
            COLORS: ['#FF6B6B', '#FFD93D', '#FF8E8E']
        },
        
        HIT: {
            COUNT: 5,
            SPEED: 100,
            LIFETIME: 500,
            COLORS: ['#FFD700', '#FFA500']
        }
    },

    // 音效设置（预留）
    AUDIO: {
        ENABLED: false,
        VOLUME: 0.5,
        SOUNDS: {
            SHOOT: 'shoot.wav',
            HIT: 'hit.wav',
            EXPLOSION: 'explosion.wav',
            GAME_OVER: 'game_over.wav'
        }
    },

    // 输入设置
    INPUT: {
        KEYBOARD: {
            LEFT: ['ArrowLeft', 'KeyA'],
            RIGHT: ['ArrowRight', 'KeyD'],
            SHOOT: ['Space']
        },
        
        TOUCH: {
            ENABLED: true,
            SENSITIVITY: 1.0
        }
    },

    // UI设置
    UI: {
        HEALTH_BAR_WIDTH: 200,
        HEALTH_BAR_HEIGHT: 30,
        FONT_SIZE: 18,
        FONT_FAMILY: 'Arial, sans-serif',
        TEXT_COLOR: '#FFFFFF',
        SHADOW_COLOR: '#000000'
    },

    // 游戏平衡性设置
    BALANCE: {
        SCORE_PER_ENEMY: 100,
        SCORE_PER_OBSTACLE: 50,
        HEALTH_REGEN_RATE: 0, // 无自动回血
        INVINCIBILITY_TIME: 1000, // 受伤后无敌时间（毫秒）
        SCREEN_SHAKE_INTENSITY: 5,
        SCREEN_SHAKE_DURATION: 200,
        MONSTER_INVINCIBLE_DISTANCE: 1800 // 怪物无敌距离（像素）
    },

    // 调试设置
    DEBUG: {
        ENABLED: true,
        SHOW_FPS: false,
        SHOW_COLLISION_BOXES: false,
        SHOW_SPAWN_POINTS: false
    }
};

// 导出配置（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
