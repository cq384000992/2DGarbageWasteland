// UI管理模块
class UIManager {
    constructor() {
        this.elements = {
            healthFill: document.getElementById('healthFill'),
            healthText: document.getElementById('healthText'),
            scoreValue: document.getElementById('scoreValue'),
            levelValue: document.getElementById('levelValue'),
            timeValue: document.getElementById('timeValue'),
            progressValue: document.getElementById('progressValue'),
            progressFill: document.getElementById('progressFill'),
            monsterCountValue: document.getElementById('monsterCountValue'),
            audioToggle: document.getElementById('audioToggle'),
            volumeSlider: document.getElementById('volumeSlider'),
            startScreen: document.getElementById('startScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            levelCompleteScreen: document.getElementById('levelCompleteScreen'),
            finalScore: document.getElementById('finalScore'),
            finalLevel: document.getElementById('finalLevel')
        };
        
        // 检查关键元素是否存在
        const requiredElements = ['healthFill', 'healthText', 'scoreValue', 'levelValue', 'timeValue', 'progressValue', 'progressFill', 'monsterCountValue'];
        const missingElements = requiredElements.filter(id => !this.elements[id]);
        if (missingElements.length > 0) {
            console.warn('缺少必要的UI元素:', missingElements);
        }
        
        this.currentScore = 0;
        this.currentLevel = 1;
        this.currentTime = 0;
        this.gameStartTime = 0;
        this.retryCount = 0; // 添加重试计数器
        this.maxRetries = 3; // 最大重试次数
        this.debugMode = false; // 开发模式，可以设置为true来启用调试
        
        // 延迟设置事件监听器，确保DOM完全加载
        this.setupEventListenersDelayed();
    }

    setupEventListenersDelayed() {
        // 简化延迟设置逻辑
        const setupListeners = () => {
            console.log('尝试设置事件监听器...');
            const startButton = document.getElementById('startButton');
            if (startButton) {
                this.setupEventListeners();
                return true;
            }
            return false;
        };
        
        // 立即尝试设置
        if (setupListeners()) {
            return;
        }
        
        // 如果失败，等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(setupListeners, 100);
            });
        } else {
            setTimeout(setupListeners, 100);
        }
        
        // 最终重试
        setTimeout(() => {
            if (!this.startButtonHandler) {
                console.log('最终重试：设置事件监听器');
                setupListeners();
            }
        }, 2000);
    }

    setupEventListeners() {
        console.log('设置事件监听器...');
        
        // 开始游戏按钮
        const startButton = document.getElementById('startButton');
        if (startButton) {
            console.log('找到开始按钮，设置事件监听器');
            console.log('按钮状态:', {
                disabled: startButton.disabled,
                style: startButton.style.cssText,
                computedStyle: {
                    display: getComputedStyle(startButton).display,
                    pointerEvents: getComputedStyle(startButton).pointerEvents,
                    cursor: getComputedStyle(startButton).cursor
                }
            });
            
            // 移除可能存在的旧事件监听器
            if (this.startButtonHandler) {
                startButton.removeEventListener('click', this.startButtonHandler);
            }
            
            this.startButtonHandler = () => {
                console.log('开始按钮被点击！');
                this.hideStartScreen();
                if (this.onGameStart) {
                    console.log('调用游戏开始回调');
                    this.onGameStart();
                } else {
                    console.warn('游戏开始回调未设置');
                }
            };
            
            startButton.addEventListener('click', this.startButtonHandler);
            console.log('开始按钮事件监听器已设置');
            
            // 添加测试事件监听器（仅在开发模式下）
            if (this.debugMode) {
                this.startButtonMouseEnterHandler = () => {
                    console.log('鼠标进入开始按钮');
                };
                this.startButtonMouseLeaveHandler = () => {
                    console.log('鼠标离开开始按钮');
                };
                
                startButton.addEventListener('mouseenter', this.startButtonMouseEnterHandler);
                startButton.addEventListener('mouseleave', this.startButtonMouseLeaveHandler);
            }
            
        } else {
            console.error('未找到开始按钮！DOM可能未完全加载');
            // 尝试延迟重试，但限制重试次数
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`延迟重试 ${this.retryCount}/${this.maxRetries}...`);
                setTimeout(() => {
                    const retryButton = document.getElementById('startButton');
                    if (retryButton) {
                        console.log('延迟重试：找到开始按钮');
                        this.setupEventListeners();
                    } else {
                        console.error('延迟重试：仍未找到开始按钮');
                    }
                }, 500);
            } else {
                console.error('达到最大重试次数，停止重试');
            }
        }

        // 重新开始按钮
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            console.log('找到重新开始按钮，设置事件监听器');
            this.restartButtonHandler = () => {
                console.log('重新开始按钮被点击');
                this.hideGameOverScreen();
                this.onGameRestart && this.onGameRestart();
            };
            restartButton.addEventListener('click', this.restartButtonHandler);
        } else {
            console.warn('未找到重新开始按钮');
        }

        // 下一关按钮
        const nextLevelButton = document.getElementById('nextLevelButton');
        if (nextLevelButton) {
            console.log('找到下一关按钮，设置事件监听器');
            this.nextLevelButtonHandler = () => {
                this.hideLevelCompleteScreen();
                this.onNextLevel && this.onNextLevel();
            };
            nextLevelButton.addEventListener('click', this.nextLevelButtonHandler);
        } else {
            console.warn('未找到下一关按钮');
        }
        
        console.log('事件监听器设置完成');
    }

    // 更新生命值显示
    updateHealth(currentHealth, maxHealth) {
        if (this.elements.healthFill && this.elements.healthText) {
            const healthPercent = (currentHealth / maxHealth) * 100;
            this.elements.healthFill.style.width = `${healthPercent}%`;
            this.elements.healthText.textContent = `血量: ${currentHealth}/${maxHealth}`;
            
            // 根据生命值改变颜色
            if (healthPercent > 60) {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #4ecdc4, #44a08d)';
            } else if (healthPercent > 30) {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #ffd93d, #ffb347)';
            } else {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
            }
        }
    }

    // 更新分数显示
    updateScore(score) {
        this.currentScore = score;
        if (this.elements.scoreValue) {
            this.elements.scoreValue.textContent = score.toLocaleString();
        }
    }

    // 更新剩余怪物数量显示
    updateMonsterCount(count) {
        if (this.elements.monsterCountValue) {
            this.elements.monsterCountValue.textContent = count;
        }
    }

    // 增加分数
    addScore(points) {
        this.updateScore(this.currentScore + points);
    }

    // 更新关卡显示
    updateLevel(level) {
        this.currentLevel = level;
        if (this.elements.levelValue) {
            this.elements.levelValue.textContent = level;
        }
    }

    // 更新时间显示
    updateTime(timeInSeconds) {
        this.currentTime = timeInSeconds;
        if (this.elements.timeValue) {
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            this.elements.timeValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // 更新关卡进度显示
    updateProgress(progressPercent) {
        if (this.elements.progressValue) {
            this.elements.progressValue.textContent = `${Math.round(progressPercent)}%`;
        }
        
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progressPercent}%`;
            
            // 根据进度改变颜色
            if (progressPercent < 30) {
                this.elements.progressFill.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
            } else if (progressPercent < 70) {
                this.elements.progressFill.style.background = 'linear-gradient(90deg, #ffd93d, #ffb347)';
            } else {
                this.elements.progressFill.style.background = 'linear-gradient(90deg, #4ecdc4, #44a08d)';
            }
        }
    }

    // 显示开始界面
    showStartScreen() {
        if (this.elements.startScreen) {
            this.elements.startScreen.style.display = 'flex';
        }
    }

    // 隐藏开始界面
    hideStartScreen() {
        if (this.elements.startScreen) {
            this.elements.startScreen.style.display = 'none';
        }
    }

    // 显示游戏结束界面
    showGameOverScreen() {
        console.log('显示游戏结束界面...');
        if (this.elements.gameOverScreen) {
            this.elements.gameOverScreen.style.display = 'flex';
            console.log('游戏结束界面已显示');
            if (this.elements.finalScore) {
                this.elements.finalScore.textContent = this.currentScore.toLocaleString();
            }
            if (this.elements.finalLevel) {
                this.elements.finalLevel.textContent = this.currentLevel;
            }
            
            // 检查重新开始按钮
            const restartButton = document.getElementById('restartButton');
            if (restartButton) {
                console.log('重新开始按钮存在，可见性:', restartButton.style.display !== 'none' ? '可见' : '不可见');
                console.log('重新开始按钮可点击性:', !restartButton.disabled ? '可点击' : '不可点击');
            } else {
                console.warn('重新开始按钮不存在');
            }
        } else {
            console.warn('游戏结束界面元素不存在');
        }
    }

    // 隐藏游戏结束界面
    hideGameOverScreen() {
        if (this.elements.gameOverScreen) {
            this.elements.gameOverScreen.style.display = 'none';
        }
    }

    // 显示关卡完成界面
    showLevelCompleteScreen() {
        if (this.elements.levelCompleteScreen) {
            this.elements.levelCompleteScreen.style.display = 'flex';
        }
    }

    // 隐藏关卡完成界面
    hideLevelCompleteScreen() {
        if (this.elements.levelCompleteScreen) {
            this.elements.levelCompleteScreen.style.display = 'none';
        }
    }

    // 重置UI状态
    reset() {
        this.currentScore = 0;
        this.currentLevel = 1;
        this.currentTime = 0;
        this.gameStartTime = Date.now();
        
        this.updateHealth(CONFIG.PLAYER.MAX_HEALTH, CONFIG.PLAYER.MAX_HEALTH);
        this.updateScore(0);
        this.updateLevel(1);
        this.updateTime(0);
        this.updateProgress(0);
        this.updateMonsterCount(0);
        
        this.hideGameOverScreen();
        this.hideLevelCompleteScreen();
        this.showStartScreen();
    }

    // 设置回调函数
    setCallbacks(callbacks) {
        this.onGameStart = callbacks.onGameStart;
        this.onGameRestart = callbacks.onGameRestart;
        this.onNextLevel = callbacks.onNextLevel;
        this.onAudioToggle = callbacks.onAudioToggle;
        this.onVolumeChange = callbacks.onVolumeChange;
    }
    
    // 初始化音频控制
    initializeAudioControls(audioManager) {
        if (this.elements.audioToggle) {
            this.elements.audioToggle.addEventListener('click', () => {
                if (this.onAudioToggle) {
                    this.onAudioToggle();
                }
            });
        }
        
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.addEventListener('input', (e) => {
                if (this.onVolumeChange) {
                    this.onVolumeChange(parseInt(e.target.value) / 100);
                }
            });
        }
        
        // 更新音频按钮状态
        this.updateAudioButton(audioManager);
    }
    
    // 更新音频按钮状态
    updateAudioButton(audioManager) {
        if (this.elements.audioToggle) {
            const isEnabled = audioManager.isEnabled;
            const isPlaying = audioManager.isBGMPlaying();
            
            if (isEnabled && isPlaying) {
                this.elements.audioToggle.textContent = '🔊';
                this.elements.audioToggle.classList.remove('muted');
            } else {
                this.elements.audioToggle.textContent = '🔇';
                this.elements.audioToggle.classList.add('muted');
            }
        }
        
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.value = audioManager.getVolume() * 100;
        }
    }

    // 显示提示信息
    showMessage(message, duration = 3000) {
        // 创建临时消息元素
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            animation: fadeInOut ${duration}ms ease-in-out;
        `;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(messageElement);
        
        // 自动移除消息
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, duration);
    }

    // 显示屏幕震动效果
    showScreenShake(intensity = CONFIG.BALANCE.SCREEN_SHAKE_INTENSITY, duration = CONFIG.BALANCE.SCREEN_SHAKE_DURATION) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        const originalTransform = canvas.style.transform;
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const progress = elapsed / duration;
                const currentIntensity = intensity * (1 - progress);
                const x = (Math.random() - 0.5) * currentIntensity;
                const y = (Math.random() - 0.5) * currentIntensity;
                
                canvas.style.transform = `translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                canvas.style.transform = originalTransform;
            }
        };
        
        shake();
    }

    // 更新游戏状态显示
    updateGameState(gameState) {
        if (gameState.player) {
            this.updateHealth(gameState.player.health, gameState.player.maxHealth);
        }
        
        if (gameState.score !== undefined) {
            this.updateScore(gameState.score);
        }
        
        if (gameState.level !== undefined) {
            this.updateLevel(gameState.level);
        }
        
        if (gameState.time !== undefined) {
            this.updateTime(gameState.time);
        }
        
        if (gameState.progress !== undefined) {
            this.updateProgress(gameState.progress);
        }
        
        if (gameState.monsterCount !== undefined) {
            this.updateMonsterCount(gameState.monsterCount);
        }
    }

    // 获取当前UI状态
    getUIState() {
        return {
            score: this.currentScore,
            level: this.currentLevel,
            time: this.currentTime
        };
    }

    // 销毁UI管理器
    destroy() {
        // 移除事件监听器 - 需要保存原始的事件处理函数引用
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        const nextLevelButton = document.getElementById('nextLevelButton');
        
        if (startButton && this.startButtonHandler) {
            startButton.removeEventListener('click', this.startButtonHandler);
            this.startButtonHandler = null;
        }
        
        // 清理调试事件监听器
        if (startButton && this.startButtonMouseEnterHandler) {
            startButton.removeEventListener('mouseenter', this.startButtonMouseEnterHandler);
            this.startButtonMouseEnterHandler = null;
        }
        if (startButton && this.startButtonMouseLeaveHandler) {
            startButton.removeEventListener('mouseleave', this.startButtonMouseLeaveHandler);
            this.startButtonMouseLeaveHandler = null;
        }
        
        if (restartButton && this.restartButtonHandler) {
            restartButton.removeEventListener('click', this.restartButtonHandler);
            this.restartButtonHandler = null;
        }
        if (nextLevelButton && this.nextLevelButtonHandler) {
            nextLevelButton.removeEventListener('click', this.nextLevelButtonHandler);
            this.nextLevelButtonHandler = null;
        }
        
        // 清理回调函数
        this.onGameStart = null;
        this.onGameRestart = null;
        this.onNextLevel = null;
        this.onAudioToggle = null;
        this.onVolumeChange = null;
    }
}

// UI管理器单例
class UIManagerSingleton {
    constructor() {
        // 每次构造都创建新实例，确保页面重新加载时状态正确
        this.uiManager = new UIManager();
        UIManagerSingleton.instance = this;
    }

    static getInstance() {
        // 检查页面是否重新加载（通过检查DOM状态）
        const isPageReloaded = !UIManagerSingleton.instance || 
                              !UIManagerSingleton.instance.uiManager ||
                              !document.getElementById('startButton');
        
        if (isPageReloaded) {
            console.log('检测到页面重新加载，创建新的UI管理器实例');
            UIManagerSingleton.instance = new UIManagerSingleton();
        }
        return UIManagerSingleton.instance;
    }

    getUIManager() {
        return this.uiManager;
    }

    // 重置UI管理器
    reset() {
        if (this.uiManager) {
            this.uiManager.reset();
        }
    }

    destroy() {
        if (this.uiManager) {
            this.uiManager.destroy();
        }
        UIManagerSingleton.instance = null;
    }
}
