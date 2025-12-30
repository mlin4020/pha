// 统计页面渲染脚本

// 全局变量
let todayRatioChart = null;

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    // 初始化事件监听
    initEventListeners();
    
    // 加载所有数据
    loadAllStats();
});

// 初始化事件监听
function initEventListeners() {
    // 返回主页面按钮
    document.getElementById('back-btn').addEventListener('click', () => {
        // 通过IPC通知主进程加载主页面
        window.electronAPI.loadMainPage();
    });

    // 时间范围选择按钮
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 更新活跃状态
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 这里不再切换内容，因为我们同时展示今日和本周数据
        });
    });
}

// 加载所有统计数据
async function loadAllStats() {
    try {
        // 并行加载今日和本周数据
        const [todayStats, weekStats, todayRecords] = await Promise.all([
            window.electronAPI.getTodayStats(),
            window.electronAPI.getWeekStats(),
            window.electronAPI.getTodayRecords()
        ]);
        
        // 渲染今日数据
        renderTodayStats(todayStats);
        
        // 渲染今日工作/休息比例图表
        renderTodayRatioChart(todayStats);
        
        // 渲染本周数据
        renderWeekStats(weekStats);
    } catch (error) {
        console.error('加载统计数据失败:', error);
        showEmptyState();
    }
}

// 渲染今日统计数据
function renderTodayStats(stats) {
    const container = document.getElementById('today-stats');
    
    // 格式化时长为小时、分钟和秒（保留小数）
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = parseFloat((seconds % 60).toFixed(2));
        
        if (hours > 0) {
            return `${hours}小时${minutes}分钟${secs}秒`;
        } else if (minutes > 0) {
            return `${minutes}分钟${secs}秒`;
        } else {
            return `${secs}秒`;
        }
    };

    // 计算工作/休息比例
    const totalTime = stats.totalWorkTime + stats.totalBreakTime;
    const workRatio = totalTime > 0 ? Math.round((stats.totalWorkTime / totalTime) * 100) : 0;
    const breakRatio = totalTime > 0 ? Math.round((stats.totalBreakTime / totalTime) * 100) : 0;

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-title">今日工作时长</div>
            <div class="stat-value">${formatDuration(stats.totalWorkTime)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">今日休息时长</div>
            <div class="stat-value">${formatDuration(stats.totalBreakTime)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">今日工作会话</div>
            <div class="stat-value">${stats.totalWorkSessions}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">今日休息会话</div>
            <div class="stat-value">${stats.totalBreakSessions}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">中断工作次数</div>
            <div class="stat-value">${stats.interruptedWorkSessions || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">中断休息次数</div>
            <div class="stat-value">${stats.interruptedBreakSessions || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">工作/休息比例</div>
            <div class="stat-value">${workRatio}% / ${breakRatio}%</div>
        </div>
    `;
}

// 渲染今日工作/休息比例图表
function renderTodayRatioChart(stats) {
    const ctx = document.getElementById('todayRatioChart').getContext('2d');
    
    // 销毁现有图表
    if (todayRatioChart) {
        todayRatioChart.destroy();
    }
    
    // 计算工作和休息的总时间
    const totalTime = stats.totalWorkTime + stats.totalBreakTime;
    const workPercentage = totalTime > 0 ? (stats.totalWorkTime / totalTime) * 100 : 0;
    const breakPercentage = totalTime > 0 ? (stats.totalBreakTime / totalTime) * 100 : 0;
    
    // 创建图表
    todayRatioChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['工作时间', '休息时间'],
            datasets: [{
                data: [workPercentage, breakPercentage],
                backgroundColor: ['#4a90e2', '#50e3c2'],
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}

// 渲染本周统计数据
function renderWeekStats(stats) {
    const container = document.getElementById('week-stats');
    
    // 格式化时长为小时、分钟和秒（保留小数）
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = parseFloat((seconds % 60).toFixed(2));
        
        if (hours > 0) {
            return `${hours}小时${minutes}分钟${secs}秒`;
        } else if (minutes > 0) {
            return `${minutes}分钟${secs}秒`;
        } else {
            return `${secs}秒`;
        }
    };

    // 计算平均每日工作时长，保留小数精度
    const averageDailyWork = formatDuration(parseFloat((stats.totalWorkTime / 7).toFixed(2)));
    
    // 计算休息率（休息时间 / (工作时间 + 休息时间)）
    const totalTime = stats.totalWorkTime + stats.totalBreakTime;
    const restRate = totalTime > 0 ? Math.round((stats.totalBreakTime / totalTime) * 100) : 0;

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-title">本周工作时长</div>
            <div class="stat-value">${formatDuration(stats.totalWorkTime)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">平均每日工作</div>
            <div class="stat-value">${averageDailyWork}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">本周休息率</div>
            <div class="stat-value">${restRate}%</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">跳过休息次数</div>
            <div class="stat-value">${stats.skippedBreaks || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">中断工作次数</div>
            <div class="stat-value">${stats.interruptedWorkSessions || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">中断休息次数</div>
            <div class="stat-value">${stats.interruptedBreakSessions || 0}</div>
        </div>
    `;
}

// 显示空状态
function showEmptyState() {
    // 今日数据空状态
    document.getElementById('today-stats').innerHTML = `
        <div class="stat-card empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-text">暂无今日数据</div>
            <div class="empty-state-subtext">开始工作后将显示统计数据</div>
        </div>
    `;
    
    // 本周数据空状态
    document.getElementById('week-stats').innerHTML = `
        <div class="stat-card empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-text">暂无本周数据</div>
            <div class="empty-state-subtext">开始工作后将显示统计数据</div>
        </div>
    `;
    
    // 隐藏图表容器
    document.getElementById('today-chart-container').style.display = 'none';
}

// 格式化日期为友好显示
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('zh-CN');
}

// 格式化时间为友好显示
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}