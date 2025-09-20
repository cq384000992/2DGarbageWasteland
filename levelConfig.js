// 关卡配置文件

const LEVEL_CONFIG = {
    // 第一关配置
    LEVEL_1: {
        name: "末日废土",
        totalLength: 5000,
        segments: [
            // 第1段 (0-500) - 超高密度，30只怪物（玩家最后遇到，最终挑战）
            {
                y: 0,
                enemies: [
                    { x: 100, y: 200, type: 'small_enemy' },
                    { x: 120, y: 250, type: 'small_enemy' },
                    { x: 140, y: 300, type: 'small_enemy' },
                    { x: 160, y: 350, type: 'small_enemy' },
                    { x: 180, y: 400, type: 'small_enemy' },
                    { x: 200, y: 450, type: 'small_enemy' },
                    { x: 220, y: 500, type: 'small_enemy' },
                    { x: 240, y: 550, type: 'small_enemy' },
                    { x: 260, y: 600, type: 'small_enemy' },
                    { x: 280, y: 650, type: 'small_enemy' },
                    { x: 300, y: 700, type: 'small_enemy' },
                    { x: 320, y: 750, type: 'small_enemy' },
                    { x: 340, y: 800, type: 'small_enemy' },
                    { x: 360, y: 850, type: 'small_enemy' },
                    { x: 380, y: 900, type: 'small_enemy' },
                    { x: 400, y: 950, type: 'small_enemy' },
                    { x: 420, y: 1000, type: 'small_enemy' },
                    { x: 440, y: 1050, type: 'small_enemy' },
                    { x: 460, y: 1100, type: 'small_enemy' },
                    { x: 480, y: 1150, type: 'small_enemy' },
                    { x: 110, y: 220, type: 'small_enemy' },
                    { x: 130, y: 270, type: 'small_enemy' },
                    { x: 150, y: 320, type: 'small_enemy' },
                    { x: 170, y: 370, type: 'small_enemy' },
                    { x: 190, y: 420, type: 'small_enemy' },
                    { x: 210, y: 470, type: 'small_enemy' },
                    { x: 230, y: 520, type: 'small_enemy' },
                    { x: 250, y: 570, type: 'small_enemy' },
                    { x: 270, y: 620, type: 'small_enemy' },
                    { x: 290, y: 670, type: 'small_enemy' }
                ],
                obstacles: [
                    { x: 250, y: 300, type: 'pile' }
                ]
            },
            // 第2段 (500-1000) - 超高密度，25只怪物
            {
                y: 500,
                enemies: [
                    { x: 100, y: 700, type: 'small_enemy' },
                    { x: 120, y: 750, type: 'small_enemy' },
                    { x: 140, y: 800, type: 'small_enemy' },
                    { x: 160, y: 850, type: 'small_enemy' },
                    { x: 180, y: 900, type: 'small_enemy' },
                    { x: 200, y: 950, type: 'small_enemy' },
                    { x: 250, y: 1000, type: 'small_enemy' },
                    { x: 300, y: 1050, type: 'small_enemy' },
                    { x: 350, y: 1100, type: 'small_enemy' },
                    { x: 400, y: 1150, type: 'small_enemy' },
                    { x: 450, y: 1200, type: 'small_enemy' },
                    { x: 500, y: 1250, type: 'small_enemy' },
                    { x: 220, y: 720, type: 'small_enemy' },
                    { x: 280, y: 770, type: 'small_enemy' },
                    { x: 320, y: 820, type: 'small_enemy' },
                    { x: 110, y: 710, type: 'small_enemy' },
                    { x: 130, y: 760, type: 'small_enemy' },
                    { x: 150, y: 810, type: 'small_enemy' },
                    { x: 170, y: 860, type: 'small_enemy' },
                    { x: 190, y: 910, type: 'small_enemy' },
                    { x: 210, y: 960, type: 'small_enemy' },
                    { x: 230, y: 1010, type: 'small_enemy' },
                    { x: 270, y: 1060, type: 'small_enemy' },
                    { x: 310, y: 1110, type: 'small_enemy' },
                    { x: 330, y: 1160, type: 'small_enemy' }
                ],
                obstacles: [
                    { x: 300, y: 800, type: 'hole' },
                    { x: 500, y: 950, type: 'pile' }
                ]
            },
            // 第3段 (1000-1500) - 高密度，20只怪物
            {
                y: 1000,
                enemies: [
                    { x: 100, y: 1200, type: 'small_enemy' },
                    { x: 150, y: 1250, type: 'small_enemy' },
                    { x: 200, y: 1300, type: 'small_enemy' },
                    { x: 250, y: 1350, type: 'small_enemy' },
                    { x: 300, y: 1400, type: 'small_enemy' },
                    { x: 350, y: 1450, type: 'small_enemy' },
                    { x: 400, y: 1500, type: 'small_enemy' },
                    { x: 450, y: 1550, type: 'small_enemy' },
                    { x: 500, y: 1600, type: 'small_enemy' },
                    { x: 120, y: 1220, type: 'small_enemy' },
                    { x: 180, y: 1270, type: 'small_enemy' },
                    { x: 220, y: 1320, type: 'small_enemy' },
                    { x: 110, y: 1210, type: 'small_enemy' },
                    { x: 130, y: 1260, type: 'small_enemy' },
                    { x: 160, y: 1310, type: 'small_enemy' },
                    { x: 190, y: 1360, type: 'small_enemy' },
                    { x: 230, y: 1410, type: 'small_enemy' },
                    { x: 260, y: 1460, type: 'small_enemy' },
                    { x: 290, y: 1510, type: 'small_enemy' },
                    { x: 320, y: 1560, type: 'small_enemy' }
                ],
                obstacles: [
                    { x: 250, y: 1300, type: 'pile' }
                ]
            },
            // 第4段 (1500-2000) - 高密度，18只怪物
            {
                y: 1500,
                enemies: [
                    { x: 100, y: 1700, type: 'small_enemy' },
                    { x: 150, y: 1750, type: 'small_enemy' },
                    { x: 200, y: 1800, type: 'small_enemy' },
                    { x: 250, y: 1850, type: 'small_enemy' },
                    { x: 300, y: 1900, type: 'small_enemy' },
                    { x: 350, y: 1950, type: 'small_enemy' },
                    { x: 400, y: 2000, type: 'small_enemy' },
                    { x: 450, y: 2050, type: 'small_enemy' },
                    { x: 500, y: 2100, type: 'small_enemy' },
                    { x: 120, y: 1720, type: 'small_enemy' },
                    { x: 110, y: 1710, type: 'small_enemy' },
                    { x: 130, y: 1760, type: 'small_enemy' },
                    { x: 160, y: 1810, type: 'small_enemy' },
                    { x: 190, y: 1860, type: 'small_enemy' },
                    { x: 230, y: 1910, type: 'small_enemy' },
                    { x: 260, y: 1960, type: 'small_enemy' },
                    { x: 290, y: 2010, type: 'small_enemy' },
                    { x: 320, y: 2060, type: 'small_enemy' }
                ],
                obstacles: [
                    { x: 300, y: 1800, type: 'hole' }
                ]
            },
            // 第5段 (2000-2500) - 中等密度，15只怪物
            {
                y: 2000,
                enemies: [
                    { x: 100, y: 2200, type: 'small_enemy' },
                    { x: 200, y: 2250, type: 'small_enemy' },
                    { x: 300, y: 2300, type: 'small_enemy' },
                    { x: 400, y: 2350, type: 'small_enemy' },
                    { x: 500, y: 2400, type: 'small_enemy' },
                    { x: 150, y: 2220, type: 'small_enemy' },
                    { x: 250, y: 2270, type: 'small_enemy' },
                    { x: 350, y: 2320, type: 'small_enemy' },
                    { x: 110, y: 2210, type: 'small_enemy' },
                    { x: 130, y: 2260, type: 'small_enemy' },
                    { x: 160, y: 2310, type: 'small_enemy' },
                    { x: 190, y: 2360, type: 'small_enemy' },
                    { x: 230, y: 2410, type: 'small_enemy' },
                    { x: 260, y: 2460, type: 'small_enemy' },
                    { x: 290, y: 2510, type: 'small_enemy' }
                ],
                obstacles: [
                    { x: 250, y: 2300, type: 'pile' },
                    { x: 450, y: 2400, type: 'hole' }
                ]
            },
            // 第6段 (2500-3000) - 中等密度，12只怪物
            {
                y: 2500,
                enemies: [
                    { x: 100, y: 2700, type: 'small_enemy' },
                    { x: 200, y: 2750, type: 'small_enemy' },
                    { x: 300, y: 2800, type: 'small_enemy' },
                    { x: 400, y: 2850, type: 'small_enemy' },
                    { x: 500, y: 2900, type: 'small_enemy' },
                    { x: 150, y: 2720, type: 'small_enemy' },
                    { x: 250, y: 2770, type: 'small_enemy' },
                    { x: 350, y: 2820, type: 'small_enemy' },
                    { x: 110, y: 2710, type: 'small_enemy' },
                    { x: 130, y: 2760, type: 'small_enemy' },
                    { x: 160, y: 2810, type: 'small_enemy' },
                    { x: 190, y: 2860, type: 'small_enemy' }
                ],
                obstacles: [
                    { x: 300, y: 2800, type: 'pile' }
                ]
            },
            // 第7段 (3000-3500) - 中等密度，10只怪物
            {
                y: 3000,
                enemies: [
                    { x: 100, y: 3200, type: 'small_enemy' },
                    { x: 200, y: 3250, type: 'small_enemy' },
                    { x: 300, y: 3300, type: 'small_enemy' },
                    { x: 400, y: 3350, type: 'small_enemy' },
                    { x: 500, y: 3400, type: 'small_enemy' },
                    { x: 150, y: 3220, type: 'small_enemy' },
                    { x: 250, y: 3270, type: 'small_enemy' },
                    { x: 350, y: 3320, type: 'small_enemy' },
                    { x: 110, y: 3210, type: 'small_enemy' },
                    { x: 130, y: 3260, type: 'small_enemy' }
                ],
                obstacles: [
                    { x: 250, y: 3300, type: 'hole' }
                ]
            },
            // 第8段 (3500-4000) - 中等密度，8只怪物
            {
                y: 3500,
                enemies: [
                    { x: 100, y: 3700, type: 'small_enemy' },
                    { x: 200, y: 3750, type: 'small_enemy' },
                    { x: 300, y: 3800, type: 'small_enemy' },
                    { x: 400, y: 3850, type: 'small_enemy' },
                    { x: 500, y: 3900, type: 'small_enemy' },
                    { x: 150, y: 3720, type: 'small_enemy' },
                    { x: 250, y: 3770, type: 'small_enemy' },
                    { x: 350, y: 3820, type: 'small_enemy' }
                ],
                obstacles: [
                    { x: 300, y: 3800, type: 'pile' },
                    { x: 500, y: 3950, type: 'hole' }
                ]
            },
            // 第9段 (4000-4500) - 中等密度，8只怪物
            {
                y: 4000,
                enemies: [
                    { x: 100, y: 4200, type: 'small_enemy' },
                    { x: 200, y: 4250, type: 'small_enemy' },
                    { x: 300, y: 4300, type: 'small_enemy' },
                    { x: 400, y: 4350, type: 'small_enemy' },
                    { x: 500, y: 4400, type: 'small_enemy' },
                    { x: 150, y: 4220, type: 'small_enemy' },
                    { x: 250, y: 4270, type: 'small_enemy' },
                    { x: 350, y: 4320, type: 'small_enemy' }
                ],
                obstacles: [
                    { x: 250, y: 4300, type: 'pile' }
                ]
            },
            // 第10段 (4500-5000) - 低密度，5只怪物（玩家最先遇到，简单开始）
            {
                y: 4500,
                enemies: [
                    { x: 100, y: 4700, type: 'small_enemy' },
                    { x: 200, y: 4800, type: 'small_enemy' },
                    { x: 300, y: 4900, type: 'small_enemy' },
                    { x: 400, y: 5000, type: 'small_enemy' },
                    { x: 500, y: 5100, type: 'small_enemy' }
                ],
                obstacles: [
                    { x: 300, y: 4800, type: 'pile' }
                ]
            }
        ]
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LEVEL_CONFIG };
}