// 末日垃圾场输入处理模块

class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.input = {
            left: false,
            right: false,
            touchStartX: 0,
            touchCurrentX: 0,
            isTouching: false,
            skill1: false,
            skill2: false
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 键盘输入
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.input.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.input.right = true;
                    break;
                case 'j':
                    this.input.skill1 = true;
                    break;
                case 'k':
                    this.input.skill2 = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.input.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.input.right = false;
                    break;
                case 'j':
                    this.input.skill1 = false;
                    break;
                case 'k':
                    this.input.skill2 = false;
                    break;
            }
        });
        
        // 触摸输入
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.input.isTouching = true;
            this.input.touchStartX = e.touches[0].clientX;
            this.input.touchCurrentX = e.touches[0].clientX;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.input.isTouching) {
                this.input.touchCurrentX = e.touches[0].clientX;
                const deltaX = this.input.touchCurrentX - this.input.touchStartX;
                
                // 降低阈值，使移动更敏感
                if (deltaX > 20) {
                    this.input.right = true;
                    this.input.left = false;
                } else if (deltaX < -20) {
                    this.input.left = true;
                    this.input.right = false;
                } else {
                    this.input.left = false;
                    this.input.right = false;
                }
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.input.isTouching = false;
            this.input.left = false;
            this.input.right = false;
        });
        
        // 鼠标输入（已禁用）
        /*
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const centerX = this.canvas.width / 2;
            
            // 降低阈值，使鼠标控制更敏感
            if (mouseX < centerX - 30) {
                this.input.left = true;
                this.input.right = false;
            } else if (mouseX > centerX + 30) {
                this.input.right = true;
                this.input.left = false;
            } else {
                this.input.left = false;
                this.input.right = false;
            }
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.input.left = false;
            this.input.right = false;
        });
        
        // 添加鼠标按下控制
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const centerX = this.canvas.width / 2;
            
            if (mouseX < centerX) {
                this.input.left = true;
                this.input.right = false;
            } else {
                this.input.right = true;
                this.input.left = false;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.input.left = false;
            this.input.right = false;
        });
        */
    }

    getInput() {
        return this.input;
    }

    reset() {
        this.input.left = false;
        this.input.right = false;
        this.input.isTouching = false;
    }
}

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputHandler;
}
