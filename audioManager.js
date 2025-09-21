// 音频管理器
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.bgmAudio = null;
        this.soundEffects = {};
        this.isEnabled = true;
        this.volume = 0.5;
        this.isInitialized = false;
    }

    // 初始化音频系统
    async initialize() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 加载BGM
            await this.loadBGM();
            
            this.isInitialized = true;
            console.log('音频系统初始化完成');
            return true;
        } catch (error) {
            console.error('音频系统初始化失败:', error);
            return false;
        }
    }

    // 加载BGM
    async loadBGM() {
        try {
            this.bgmAudio = new Audio('src/末日垃圾场.m4a');
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = this.volume;
            this.bgmAudio.preload = 'auto';
            
            // 处理音频加载错误
            this.bgmAudio.addEventListener('error', (e) => {
                console.warn('BGM加载失败，继续游戏:', e);
            });
            
            // 添加超时机制
            const loadPromise = new Promise((resolve) => {
                this.bgmAudio.addEventListener('canplaythrough', () => {
                    console.log('BGM加载完成');
                    resolve(true);
                });
                
                this.bgmAudio.addEventListener('error', () => {
                    console.warn('BGM加载失败，使用静音模式');
                    resolve(false);
                });
                
                // 3秒超时
                setTimeout(() => {
                    console.warn('BGM加载超时，使用静音模式');
                    resolve(false);
                }, 3000);
            });
            
            return await loadPromise;
        } catch (error) {
            console.warn('BGM加载失败，使用静音模式:', error);
            return false;
        }
    }

    // 播放BGM
    playBGM() {
        if (!this.isEnabled || !this.bgmAudio || !this.isInitialized) {
            return;
        }

        try {
            // 如果音频上下文被暂停，恢复它
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // 播放BGM
            this.bgmAudio.currentTime = 0;
            this.bgmAudio.play().catch(error => {
                console.error('BGM播放失败:', error);
            });
            
            console.log('BGM开始播放');
        } catch (error) {
            console.error('BGM播放失败:', error);
        }
    }

    // 停止BGM
    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            console.log('BGM已停止');
        }
    }

    // 暂停BGM
    pauseBGM() {
        if (this.bgmAudio && !this.bgmAudio.paused) {
            this.bgmAudio.pause();
            console.log('BGM已暂停');
        }
    }

    // 恢复BGM
    resumeBGM() {
        if (this.bgmAudio && this.bgmAudio.paused) {
            this.bgmAudio.play().catch(error => {
                console.error('BGM恢复失败:', error);
            });
            console.log('BGM已恢复');
        }
    }

    // 设置音量
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.volume;
        }
        
        console.log(`音量设置为: ${(this.volume * 100).toFixed(0)}%`);
    }

    // 启用/禁用音频
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (!enabled) {
            this.stopBGM();
        }
        
        console.log(`音频系统${enabled ? '启用' : '禁用'}`);
    }

    // 检查是否正在播放
    isBGMPlaying() {
        return this.bgmAudio && !this.bgmAudio.paused;
    }

    // 获取当前音量
    getVolume() {
        return this.volume;
    }

    // 获取音频状态
    getStatus() {
        return {
            isEnabled: this.isEnabled,
            isInitialized: this.isInitialized,
            isBGMPlaying: this.isBGMPlaying(),
            volume: this.volume,
            audioContextState: this.audioContext ? this.audioContext.state : 'not initialized'
        };
    }

    // 销毁音频管理器
    destroy() {
        this.stopBGM();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.bgmAudio = null;
        this.audioContext = null;
        this.isInitialized = false;
        
        console.log('音频管理器已销毁');
    }
}

// 音频管理器单例
class AudioManagerSingleton {
    constructor() {
        // 每次构造都创建新实例，确保页面重新加载时状态正确
        this.audioManager = new AudioManager();
        AudioManagerSingleton.instance = this;
    }

    static getInstance() {
        // 检查页面是否重新加载（通过检查DOM状态）
        const isPageReloaded = !AudioManagerSingleton.instance || 
                              !AudioManagerSingleton.instance.audioManager ||
                              !document.getElementById('gameCanvas');
        
        if (isPageReloaded) {
            console.log('检测到页面重新加载，创建新的音频管理器实例');
            AudioManagerSingleton.instance = new AudioManagerSingleton();
        }
        return AudioManagerSingleton.instance;
    }

    getAudioManager() {
        return this.audioManager;
    }

    destroy() {
        if (this.audioManager) {
            this.audioManager.destroy();
        }
        AudioManagerSingleton.instance = null;
    }
}



