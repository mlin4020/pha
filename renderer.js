// DOM 加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
    // 判断当前是哪个窗口
    const isBreakWindow = window.location.pathname.includes('break.html');
    
    if (isBreakWindow) {
        initBreakWindow();
    } else {
        initMainWindow();
    }
});

// 初始化主窗口
function initMainWindow() {
    // 获取DOM元素
    const statusElement = document.getElementById('status');
    const timerElement = document.getElementById('timer');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const immediateBreakBtn = document.getElementById('immediate-break-btn');
    const resetBtn = document.getElementById('reset-btn');
    const workDurationInput = document.getElementById('work-duration');
    const breakDurationInput = document.getElementById('break-duration');
    
    // 格式化时间（秒 -> mm:ss）
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 更新状态显示
    function updateStatus(isWorking, isBreak) {
        if (isWorking) {
            statusElement.textContent = '工作中...';
            statusElement.setAttribute('data-status', 'working');
        } else if (isBreak) {
            statusElement.textContent = '休息中...';
            statusElement.setAttribute('data-status', 'break');
        } else {
            statusElement.textContent = '准备开始工作';
            statusElement.setAttribute('data-status', 'ready');
        }
    }
    
    // 更新按钮状态
    function updateButtonStates(isWorking, isBreak, isRunning) {
        // 工作中
        if (isWorking) {
            // 运行中显示暂停按钮，暂停时显示继续按钮
            startBtn.textContent = isRunning ? '暂停' : '继续';
            pauseBtn.style.display = 'none'; // 只使用startBtn，隐藏独立的pauseBtn
            startBtn.style.display = 'inline-block';
            immediateBreakBtn.style.display = 'inline-block';
        }
        // 休息中
        else if (isBreak) {
            startBtn.textContent = '开始工作';
            pauseBtn.style.display = 'none';
            startBtn.style.display = 'inline-block';
            immediateBreakBtn.style.display = 'none';
        }
        // 准备状态
        else {
            startBtn.textContent = '开始工作';
            pauseBtn.style.display = 'none';
            startBtn.style.display = 'inline-block';
            immediateBreakBtn.style.display = 'none';
        }
        
        // 根据按钮文本动态切换CSS类
        if (startBtn.textContent === '暂停') {
            // 暂停按钮使用次要样式
            startBtn.classList.remove('btn-primary');
            startBtn.classList.add('btn-secondary');
        } else {
            // 开始工作和继续按钮使用主要样式
            startBtn.classList.remove('btn-secondary');
            startBtn.classList.add('btn-primary');
        }
    }
    
    // 更新倒计时显示
    function updateTimerDisplay(seconds, isWorking, isBreak, isRunning) {
        timerElement.textContent = formatTime(seconds);
        updateStatus(isWorking, isBreak);
        updateButtonStates(isWorking, isBreak, isRunning);
    }
    
    // 监听主进程发送的时间更新
    window.electronAPI.onUpdateTime((time, isWorking, isBreak, isRunning) => {
        updateTimerDisplay(time, isWorking, isBreak, isRunning);
    });
    
    // 监听计时器开始事件
    window.electronAPI.onTimerStarted(() => {
        // 直接从主进程接收最新状态，而不是依赖DOM属性
        // 当startTimer被调用时，主进程会发送update-time事件，包含完整状态
        // 这个事件主要作为冗余保障
    });
    
    // 监听计时器暂停事件
    window.electronAPI.onTimerPaused(() => {
        // 直接从主进程接收最新状态，而不是依赖DOM属性
        // 当pauseTimer被调用时，主进程会发送update-time事件，包含完整状态
        // 这个事件主要作为冗余保障
    });
    
    // 监听计时器重置事件
    window.electronAPI.onTimerReset(() => {
        updateButtonStates(false, false, false);
    });
    
    // 开始/暂停/继续按钮点击事件
    startBtn.addEventListener('click', () => {
        // 根据按钮文本判断执行的操作
        if (startBtn.textContent === '开始工作') {
            window.electronAPI.startTimer();
        } else if (startBtn.textContent === '暂停') {
            window.electronAPI.pauseTimer();
        } else if (startBtn.textContent === '继续') {
            window.electronAPI.resumeTimer();
        }
    });
    
    // 暂停按钮点击事件（保留，防止意外）
    pauseBtn.addEventListener('click', () => {
        window.electronAPI.pauseTimer();
    });
    
    // 立即休息按钮点击事件
    immediateBreakBtn.addEventListener('click', () => {
        window.electronAPI.immediateBreak();
    });
    
    // 重置按钮点击事件
    resetBtn.addEventListener('click', () => {
        window.electronAPI.resetTimer();
    });
    
    // 统计按钮点击事件
    const statsBtn = document.getElementById('stats-btn');
    statsBtn.addEventListener('click', () => {
        // 通过IPC通知主进程加载统计页面
        window.electronAPI.loadStatsPage();
    });
    
    // 工作时长变化事件
    workDurationInput.addEventListener('change', (e) => {
        const duration = parseFloat(e.target.value) * 60;
        window.electronAPI.setWorkDuration(duration);
    });
    
    // 休息时长变化事件
    breakDurationInput.addEventListener('change', (e) => {
        const duration = parseFloat(e.target.value) * 60;
        window.electronAPI.setBreakDuration(duration);
    });
    
    // 初始化按钮状态
    updateButtonStates(false, false, false);
}

// 初始化休息窗口
function initBreakWindow() {
    // 获取DOM元素
    const breakTimerElement = document.getElementById('break-timer');
    const skipBreakBtn = document.getElementById('skip-break-btn');
    const acknowledgeBreakBtn = document.getElementById('acknowledge-break-btn');
    
    // 格式化时间（秒 -> mm:ss）
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 更新休息倒计时显示
    function updateBreakTimerDisplay(seconds) {
        breakTimerElement.textContent = formatTime(seconds);
    }
    
    // 监听休息时长
    window.electronAPI.onBreakDuration((duration) => {
        updateBreakTimerDisplay(duration);
    });
    
    // 监听休息时间更新
    window.electronAPI.onUpdateBreakTime((time) => {
        updateBreakTimerDisplay(time);
    });
    
    // "知道了"按钮点击事件 - 最小化休息窗口，继续后台休息
    acknowledgeBreakBtn.addEventListener('click', () => {
        window.electronAPI.acknowledgeBreak();
    });
    
    // 跳过休息按钮点击事件
    skipBreakBtn.addEventListener('click', () => {
        window.electronAPI.skipBreak();
    });
}
