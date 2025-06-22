// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('三元宇宙导航页面已加载');
    
    // 检测背景图片是否加载成功
    checkBackgroundImage();
    
    // 初始化基础功能
    initializeBasicFeatures();
});

// 检测背景图片
function checkBackgroundImage() {
    const backgroundContainer = document.querySelector('.background-container');
    
    // 可能的背景图片路径
    const imagePaths = [
        'assets/images/bg/backg.png',
        'assets/images/bg/background.webp',
        'assets/images/bg/background.jpg',
        'assets/images/bg/background.png',
        'assets/images/bg/bg.webp',
        'assets/images/bg/bg.jpg',
        'assets/images/bg/bg.png'
    ];
    
    let imageFound = false;
    
    // 检查每个可能的图片路径
    imagePaths.forEach(path => {
        const img = new Image();
        img.onload = function() {
            if (!imageFound) {
                imageFound = true;
                backgroundContainer.classList.add('has-image');
                console.log(`背景图片加载成功: ${path}`);
            }
        };
        img.onerror = function() {
            console.log(`背景图片未找到: ${path}`);
        };
        img.src = path;
    });
    
    // 如果没有找到背景图片，使用动态背景
    setTimeout(() => {
        if (!imageFound) {
            console.log('未找到背景图片，使用动态渐变背景');
        }
    }, 1000);
}

// 初始化基础功能
function initializeBasicFeatures() {
    // 添加简单的键盘交互
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            console.log('准备开始设计...');
        }
    });
    
    // 添加点击交互
    document.addEventListener('click', function(e) {
        createClickEffect(e);
    });
    
    // 窗口大小改变时的处理
    window.addEventListener('resize', function() {
        console.log('窗口大小已改变');
    });
}

// 创建点击效果
function createClickEffect(e) {
    const effect = document.createElement('div');
    effect.style.cssText = `
        position: fixed;
        top: ${e.clientY}px;
        left: ${e.clientX}px;
        width: 20px;
        height: 20px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: clickRipple 0.6s ease-out forwards;
        pointer-events: none;
        z-index: 9999;
    `;
    
    document.body.appendChild(effect);
    
    // 添加点击动画样式
    if (!document.querySelector('#clickEffectStyles')) {
        const style = document.createElement('style');
        style.id = 'clickEffectStyles';
        style.textContent = `
            @keyframes clickRipple {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(0);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(4);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        effect.remove();
    }, 600);
}

// 工具函数：显示消息
function showMessage(message, duration = 3000) {
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        animation: slideInDown 0.3s ease-out;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.style.animation = 'slideOutUp 0.3s ease-out forwards';
        setTimeout(() => {
            messageEl.remove();
        }, 300);
    }, duration);
}

// 添加动画样式
if (!document.querySelector('#messageStyles')) {
    const style = document.createElement('style');
    style.id = 'messageStyles';
    style.textContent = `
        @keyframes slideInDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        @keyframes slideOutUp {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
        }
    `;
    document.head.appendChild(style);
}

// 微信二维码模态框功能
function showWechatQR() {
    const modal = document.getElementById('wechatModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        // 点击模态框背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeWechatQR();
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeWechatQR();
            }
        });
    }
}

function closeWechatQR() {
    const modal = document.getElementById('wechatModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // 恢复滚动
    }
}

// 全局变量和函数，供后续开发使用
window.SanyuanHomepage = {
    showMessage: showMessage,
    showWechatQR: showWechatQR,
    closeWechatQR: closeWechatQR,
    version: '1.0.0',
    ready: true
};

// 将函数添加到全局作用域，供HTML调用
window.showWechatQR = showWechatQR;
window.closeWechatQR = closeWechatQR;

console.log('三元宇宙导航系统初始化完成 ✨');

// ===== 移动端优化增强功能 =====

// 检测设备类型
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

// 移动端初始化
if (isMobileDevice() || isTouchDevice()) {
    document.addEventListener('DOMContentLoaded', function() {
        initMobileOptimizations();
    });
}

function initMobileOptimizations() {
    console.log('初始化移动端优化功能');
    
    // 添加移动端特定的触摸反馈
    addTouchFeedback();
    
    // 优化移动端性能
    optimizeMobilePerformance();
    
    // 添加移动端手势支持
    addMobileGestures();
    
    // 移动端特定的可见性优化
    optimizeMobileVisibility();
}

// 添加触摸反馈
function addTouchFeedback() {
    const touchableElements = document.querySelectorAll('.energy-title, .energy-orb, .close');
    
    touchableElements.forEach(element => {
        // 触摸开始
        element.addEventListener('touchstart', function(e) {
            this.classList.add('touch-active');
            
            // 创建触摸波纹效果
            createTouchRipple(e.touches[0]);
        }, { passive: true });
        
        // 触摸结束
        element.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
            
            // 延迟移除效果，让用户能看到
            setTimeout(() => {
                this.classList.remove('touch-active');
            }, 150);
        }, { passive: true });
        
        // 触摸取消
        element.addEventListener('touchcancel', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
}

// 创建触摸波纹效果
function createTouchRipple(touch) {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: fixed;
        top: ${touch.clientY}px;
        left: ${touch.clientX}px;
        width: 30px;
        height: 30px;
        background: rgba(0, 212, 255, 0.4);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: touchRipple 0.6s ease-out forwards;
        pointer-events: none;
        z-index: 9999;
    `;
    
    document.body.appendChild(ripple);
    
    // 添加触摸波纹动画
    if (!document.querySelector('#touchRippleStyles')) {
        const style = document.createElement('style');
        style.id = 'touchRippleStyles';
        style.textContent = `
            @keyframes touchRipple {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(0);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(4);
                }
            }
            .touch-active {
                transform: scale(0.95) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// 优化移动端性能
function optimizeMobilePerformance() {
    // 减少动画在移动端的计算负担
    if (window.innerWidth <= 480) {
        console.log('应用移动端性能优化');
        
        // 简化某些复杂动画
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            if (index % 2 === 0) {
                particle.style.display = 'none'; // 隐藏一半粒子以提升性能
            }
        });
        
        // 减少能量点的数量
        const energyDots = document.querySelectorAll('.energy-dot');
        energyDots.forEach((dot, index) => {
            if (index > 3) {
                dot.style.display = 'none';
            }
        });
    }
}

// 添加移动端手势支持
function addMobileGestures() {
    let startY = 0;
    let startX = 0;
    
    // 添加简单的滑动手势
    document.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        const endY = e.changedTouches[0].clientY;
        const endX = e.changedTouches[0].clientX;
        const diffY = startY - endY;
        const diffX = startX - endX;
        
        // 检测垂直滑动
        if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
            if (diffY > 0) {
                // 向上滑动
                console.log('向上滑动手势');
            } else {
                // 向下滑动
                console.log('向下滑动手势');
            }
        }
        
        // 检测水平滑动
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // 向左滑动
                console.log('向左滑动手势');
            } else {
                // 向右滑动
                console.log('向右滑动手势');
            }
        }
    }, { passive: true });
}

// 移动端可见性优化
function optimizeMobileVisibility() {
    // 当页面不可见时暂停动画以节省电池
    document.addEventListener('visibilitychange', function() {
        const allAnimatedElements = document.querySelectorAll('.energy-title, .energy-orb, .energy-dot, .large-orb, .particle');
        
        if (document.visibilityState === 'hidden') {
            console.log('页面隐藏，暂停动画');
            allAnimatedElements.forEach(element => {
                element.style.animationPlayState = 'paused';
            });
        } else {
            console.log('页面显示，恢复动画');
            allAnimatedElements.forEach(element => {
                element.style.animationPlayState = 'running';
            });
        }
    });
}

// 移动端屏幕方向变化处理
window.addEventListener('orientationchange', function() {
    console.log('屏幕方向已改变');
    
    // 延迟处理以确保新的视口尺寸生效
    setTimeout(() => {
        // 重新计算元素位置
        optimizeMobileLayout();
        
        // 显示提示信息
        if (window.orientation === 90 || window.orientation === -90) {
            showMessage('已切换到横屏模式', 2000);
        } else {
            showMessage('已切换到竖屏模式', 2000);
        }
    }, 100);
});

// 优化移动端布局
function optimizeMobileLayout() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    console.log(`视口尺寸: ${viewportWidth}x${viewportHeight}`);
    
    // 根据屏幕尺寸调整主容器
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer && viewportHeight < 600) {
        mainContainer.style.padding = '15px';
    }
}

// 移动端错误处理
window.addEventListener('error', function(e) {
    if (isMobileDevice()) {
        console.error('移动端发生错误:', e.error);
        
        // 移动端友好的错误提示
        showMessage('页面加载遇到问题，请刷新重试', 3000);
    }
});

// 移动端网络状态监听
if ('connection' in navigator) {
    function updateNetworkStatus() {
        const connection = navigator.connection;
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            console.log('检测到慢速网络，启用省电模式');
            
            // 在慢速网络下减少动画效果
            document.documentElement.style.setProperty('--animation-duration', '8s');
            
            showMessage('网络较慢，已优化显示效果', 3000);
        }
    }
    
    navigator.connection.addEventListener('change', updateNetworkStatus);
    updateNetworkStatus(); // 初始检查
} 