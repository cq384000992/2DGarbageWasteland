// 输入处理模块
class InputHandler {
    constructor() {
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.isTouching = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 键盘事件
        this.keydownHandler = (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        };
        
        this.keyupHandler = (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);

        // 触摸事件
        if (CONFIG.INPUT.TOUCH.ENABLED) {
            this.touchstartHandler = (e) => {
                e.preventDefault();
                if (e.touches.length > 0) {
                    this.touchStartX = e.touches[0].clientX;
                    this.touchStartY = e.touches[0].clientY;
                    this.touchCurrentX = this.touchStartX;
                    this.touchCurrentY = this.touchStartY;
                    this.isTouching = true;
                }
            };
            
            this.touchmoveHandler = (e) => {
                e.preventDefault();
                if (e.touches.length > 0) {
                    this.touchCurrentX = e.touches[0].clientX;
                    this.touchCurrentY = e.touches[0].clientY;
                }
            };
            
            this.touchendHandler = (e) => {
                e.preventDefault();
                this.isTouching = false;
            };
            
            this.touchcancelHandler = (e) => {
                e.preventDefault();
                this.isTouching = false;
            };
            
            document.addEventListener('touchstart', this.touchstartHandler);
            document.addEventListener('touchmove', this.touchmoveHandler);
            document.addEventListener('touchend', this.touchendHandler);
            document.addEventListener('touchcancel', this.touchcancelHandler);
        }

        // 鼠标事件
        this.mousemoveHandler = (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        };
        
        this.mousedownHandler = (e) => {
            this.isMouseDown = true;
            e.preventDefault();
        };
        
        this.mouseupHandler = (e) => {
            this.isMouseDown = false;
            e.preventDefault();
        };
        
        this.contextmenuHandler = (e) => {
            e.preventDefault();
        };
        
        document.addEventListener('mousemove', this.mousemoveHandler);
        document.addEventListener('mousedown', this.mousedownHandler);
        document.addEventListener('mouseup', this.mouseupHandler);
        document.addEventListener('contextmenu', this.contextmenuHandler);

        // 防止页面滚动
        document.addEventListener('scroll', (e) => {
            e.preventDefault();
        });

        // 防止页面缩放
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
        });
    }

    // 检查是否按下指定键
    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }

    // 检查是否按下左移键
    isLeftPressed() {
        return CONFIG.INPUT.KEYBOARD.LEFT.some(key => this.isKeyPressed(key));
    }

    // 检查是否按下右移键
    isRightPressed() {
        return CONFIG.INPUT.KEYBOARD.RIGHT.some(key => this.isKeyPressed(key));
    }

    // 检查是否按下射击键
    isShootPressed() {
        return CONFIG.INPUT.KEYBOARD.SHOOT.some(key => this.isKeyPressed(key));
    }

    isUpPressed() {
        return CONFIG.INPUT.KEYBOARD.UP.some(key => this.isKeyPressed(key));
    }

    isDownPressed() {
        return CONFIG.INPUT.KEYBOARD.DOWN.some(key => this.isKeyPressed(key));
    }

    // 获取触摸移动方向
    getTouchDirection() {
        if (!this.isTouching) return 0;
        
        const deltaX = this.touchCurrentX - this.touchStartX;
        const sensitivity = CONFIG.INPUT.TOUCH.SENSITIVITY;
        
        if (Math.abs(deltaX) > 50 * sensitivity) {
            return deltaX > 0 ? 1 : -1; // 1为右，-1为左
        }
        return 0;
    }

    getTouchVerticalDirection() {
        if (!this.isTouching) return 0;
        
        const deltaY = this.touchCurrentY - this.touchStartY;
        const sensitivity = CONFIG.INPUT.TOUCH.SENSITIVITY;
        
        if (Math.abs(deltaY) > 50 * sensitivity) {
            return deltaY > 0 ? 1 : -1; // 1为下，-1为上
        }
        return 0;
    }

    // 获取鼠标移动方向（相对于屏幕中心）
    getMouseDirection() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return 0;
        
        const canvasRect = canvas.getBoundingClientRect();
        const centerX = canvasRect.left + canvasRect.width / 2;
        const deltaX = this.mouseX - centerX;
        
        if (Math.abs(deltaX) > 50) {
            return deltaX > 0 ? 1 : -1; // 1为右，-1为左
        }
        return 0;
    }

    getMouseVerticalDirection() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return 0;
        
        const canvasRect = canvas.getBoundingClientRect();
        const centerY = canvasRect.top + canvasRect.height / 2;
        const deltaY = this.mouseY - centerY;
        
        if (Math.abs(deltaY) > 50) {
            return deltaY > 0 ? 1 : -1; // 1为下，-1为上
        }
        return 0;
    }

    // 获取玩家移动输入
    getPlayerMovement() {
        let direction = 0;
        
        // 键盘输入优先级最高
        if (this.isLeftPressed()) {
            direction = -1;
        } else if (this.isRightPressed()) {
            direction = 1;
        }
        // 如果没有键盘输入，检查触摸输入
        else if (this.isTouching) {
            direction = this.getTouchDirection();
        }
        // 最后检查鼠标输入
        else if (this.isMouseDown) {
            direction = this.getMouseDirection();
        }
        
        return direction;
    }

    // 获取玩家垂直移动输入（已禁用，主角自动移动）
    getVerticalMovement() {
        return 0; // 主角不需要垂直移动控制
    }

    // 获取射击输入
    getShootInput() {
        return this.isShootPressed();
    }

    // 重置触摸状态
    resetTouch() {
        this.isTouching = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
    }

    // 获取输入状态信息（用于调试）
    getInputState() {
        return {
            keys: { ...this.keys },
            touch: {
                isTouching: this.isTouching,
                startX: this.touchStartX,
                startY: this.touchStartY,
                currentX: this.touchCurrentX,
                currentY: this.touchCurrentY
            },
            mouse: {
                x: this.mouseX,
                y: this.mouseY,
                isDown: this.isMouseDown
            }
        };
    }

    // 清理事件监听器
    destroy() {
        // 移除键盘事件监听器
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }
        if (this.keyupHandler) {
            document.removeEventListener('keyup', this.keyupHandler);
            this.keyupHandler = null;
        }
        
        // 移除触摸事件监听器
        if (this.touchstartHandler) {
            document.removeEventListener('touchstart', this.touchstartHandler);
            this.touchstartHandler = null;
        }
        if (this.touchmoveHandler) {
            document.removeEventListener('touchmove', this.touchmoveHandler);
            this.touchmoveHandler = null;
        }
        if (this.touchendHandler) {
            document.removeEventListener('touchend', this.touchendHandler);
            this.touchendHandler = null;
        }
        if (this.touchcancelHandler) {
            document.removeEventListener('touchcancel', this.touchcancelHandler);
            this.touchcancelHandler = null;
        }
        
        // 移除鼠标事件监听器
        if (this.mousemoveHandler) {
            document.removeEventListener('mousemove', this.mousemoveHandler);
            this.mousemoveHandler = null;
        }
        if (this.mousedownHandler) {
            document.removeEventListener('mousedown', this.mousedownHandler);
            this.mousedownHandler = null;
        }
        if (this.mouseupHandler) {
            document.removeEventListener('mouseup', this.mouseupHandler);
            this.mouseupHandler = null;
        }
        if (this.contextmenuHandler) {
            document.removeEventListener('contextmenu', this.contextmenuHandler);
            this.contextmenuHandler = null;
        }
        
        // 重置状态
        this.keys = {};
        this.isTouching = false;
        this.isMouseDown = false;
    }
}

// 输入管理器（单例模式）
class InputManager {
    constructor() {
        // 每次构造都创建新实例，确保页面重新加载时状态正确
        this.inputHandler = new InputHandler();
        this.lastInputTime = 0;
        this.inputCooldown = 100; // 输入冷却时间（毫秒）
        
        InputManager.instance = this;
    }

    // 获取输入管理器实例
    static getInstance() {
        // 检查页面是否重新加载（通过检查DOM状态）
        const isPageReloaded = !InputManager.instance || 
                              !InputManager.instance.inputHandler ||
                              !document.getElementById('gameCanvas');
        
        if (isPageReloaded) {
            console.log('检测到页面重新加载，创建新的输入管理器实例');
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }

    // 更新输入状态
    update(deltaTime) {
        this.lastInputTime += deltaTime;
    }

    // 获取玩家移动输入
    getPlayerMovement() {
        return this.inputHandler.getPlayerMovement();
    }

    // 获取玩家垂直移动输入
    getVerticalMovement() {
        return this.inputHandler.getVerticalMovement();
    }

    // 获取射击输入
    getShootInput() {
        return this.inputHandler.getShootInput();
    }

    // 检查是否有任何输入
    hasAnyInput() {
        return this.getPlayerMovement() !== 0 || this.getShootInput();
    }

    // 获取输入状态（用于调试）
    getInputState() {
        return this.inputHandler.getInputState();
    }

    // 重置输入状态
    reset() {
        this.inputHandler.resetTouch();
        this.lastInputTime = 0;
    }

    // 销毁输入管理器
    destroy() {
        this.inputHandler.destroy();
        InputManager.instance = null;
    }
}
