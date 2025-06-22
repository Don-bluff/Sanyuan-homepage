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
        document.body.style.overflow = ''; // 恢复滚动
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