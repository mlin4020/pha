const ReadyState = require('./states/ReadyState');
const WorkState = require('./states/WorkState');
const BreakState = require('./states/BreakState');

class TimerStateManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.timer = null;
        this.isRunning = false;
        this.remainingTime = 0;
        this.workDuration = 25 * 60; // 默认工作时长25分钟
        this.breakDuration = 5 * 60; // 默认休息时长5分钟
        
        // 初始化状态
        this.states = {
            ready: new ReadyState(this),
            work: new WorkState(this),
            break: new BreakState(this)
        };
        this.currentState = this.states.ready;
        
        // 观察者列表
        this.observers = [];
        
        // 添加数据管理器作为观察者
        this.addObserver(dataManager);
        
        // 初始化剩余时间
        this.remainingTime = this.workDuration;
    }
    
    // 观察者模式 - 添加观察者
    addObserver(observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
        }
    }
    
    // 观察者模式 - 移除观察者
    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }
    
    // 观察者模式 - 通知所有观察者
    notifyObservers(event) {
        this.observers.forEach(observer => {
            if (typeof observer.onStateChange === 'function') {
                observer.onStateChange(event);
            }
        });
    }
    
    // 切换状态
    setState(newStateName) {
        const oldState = this.currentState;
        const newState = this.states[newStateName];
        
        if (!newState) {
            throw new Error(`Invalid state: ${newStateName}`);
        }
        
        this.currentState = newState;
        
        // 通知观察者状态变化
        this.notifyObservers({
            type: 'stateChange',
            oldState: oldState.name,
            newState: newState.name,
            timestamp: Date.now()
        });
        
        // 更新UI
        this.updateUI();
    }
    
    // 更新UI
    updateUI() {
        // 这个方法会在子类中实现，用于更新主窗口
        console.log(`状态已更新为: ${this.currentState.name}`);
    }
    
    // 设置更新UI的回调
    setUpdateUICallback(callback) {
        this.updateUICallback = callback;
    }
    
    // 调用更新UI回调
    updateUI() {
        if (this.updateUICallback) {
            this.updateUICallback({
                time: this.remainingTime,
                isWorking: this.currentState.name === 'work',
                isBreak: this.currentState.name === 'break',
                isRunning: this.isRunning
            });
        }
        
        // 当处于休息状态时，发送休息时间更新事件
        if (this.currentState.name === 'break' && this.breakWindowCallback) {
            this.breakWindowCallback(this.remainingTime);
        }
    }
    
    // 设置休息窗口更新回调
    setBreakWindowCallback(callback) {
        this.breakWindowCallback = callback;
    }
    
    // 设置工作时长
    setWorkDuration(duration) {
        this.workDuration = duration;
        if (this.currentState.name === 'ready') {
            this.remainingTime = duration;
            this.updateUI();
        }
    }
    
    // 设置休息时长
    setBreakDuration(duration) {
        this.breakDuration = duration;
    }
    
    // 开始工作
    startWork(interruptedBreak = false) {
        // 停止当前计时器
        this.stopTimer();
        
        // 如果之前在休息状态，结束休息会话
        if (interruptedBreak) {
            this.dataManager.endCurrentSession(true);
        }
        
        // 开始工作会话
        this.dataManager.startWorkSession(this.workDuration);
        
        // 设置状态为工作中
        this.setState('work');
        this.isRunning = true;
        this.remainingTime = this.workDuration;
        
        // 启动计时器
        this.startTimer();
    }
    
    // 结束工作，开始休息
    finishWork() {
        // 停止当前计时器
        this.stopTimer();
        
        // 结束工作会话（正常结束）
        this.dataManager.endCurrentSession(false);
        
        // 开始休息
        this.startBreak(false);
    }
    
    // 开始休息
    startBreak(interruptedWork = false) {
        // 停止当前计时器
        this.stopTimer();
        
        // 如果之前在工作状态，结束工作会话
        if (interruptedWork) {
            this.dataManager.endCurrentSession(true);
        }
        
        // 开始休息会话
        this.dataManager.startBreakSession(this.breakDuration);
        
        // 设置状态为休息中
        this.setState('break');
        this.isRunning = true;
        this.remainingTime = this.breakDuration;
        
        // 启动计时器
        this.startTimer();
    }
    
    // 结束休息，开始工作
    finishBreak() {
        // 停止当前计时器
        this.stopTimer();
        
        // 结束休息会话（正常结束）
        this.dataManager.endCurrentSession(false);
        
        // 开始工作
        this.startWork(false);
    }
    
    // 跳过休息
    skipBreak() {
        // 停止当前计时器
        this.stopTimer();
        
        // 结束休息会话（中断）
        this.dataManager.endCurrentSession(true);
        
        // 开始工作
        this.startWork(false);
    }
    
    // 确认休息
    acknowledgeBreak() {
        // 只隐藏休息窗口，不改变状态
        this.notifyObservers({
            type: 'acknowledgeBreak'
        });
    }
    
    // 开始计时器
    startTimer() {
        this.timer = setInterval(() => {
            this.remainingTime--;
            
            // 更新UI
            this.updateUI();
            
            // 检查时间是否结束
            if (this.remainingTime <= 0) {
                if (this.currentState.name === 'work') {
                    this.currentState.finish();
                } else if (this.currentState.name === 'break') {
                    this.currentState.finish();
                }
            }
        }, 1000);
    }
    
    // 停止计时器
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    // 暂停计时器
    pauseTimer() {
        if (this.isRunning) {
            this.stopTimer();
            this.isRunning = false;
            this.updateUI();
        }
    }
    
    // 继续计时器
    resumeTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTimer();
            this.updateUI();
        }
    }
    
    // 重置计时器
    resetTimer() {
        // 停止计时器
        this.stopTimer();
        
        // 结束当前会话（如果有）
        if (this.currentState.name !== 'ready') {
            this.dataManager.endCurrentSession(true);
        }
        
        // 重置状态
        this.setState('ready');
        this.isRunning = false;
        this.remainingTime = this.workDuration;
        
        // 更新UI
        this.updateUI();
    }
    
    // 状态委托方法
    start() {
        this.currentState.start();
    }
    
    pause() {
        this.currentState.pause();
    }
    
    resume() {
        this.currentState.resume();
    }
    
    finish() {
        this.currentState.finish();
    }
    
    skip() {
        this.currentState.skip();
    }
    
    acknowledge() {
        this.currentState.acknowledge();
    }
    
    immediateBreak() {
        this.currentState.immediateBreak();
    }
}

module.exports = TimerStateManager;