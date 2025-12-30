const TimerState = require('./TimerState');

class BreakState extends TimerState {
    constructor(stateManager) {
        super(stateManager);
        this.name = 'break';
    }

    start() {
        // 休息状态下开始工作，中断休息
        this.stateManager.startWork(true);
    }

    pause() {
        // 休息状态下暂停
        this.stateManager.pauseTimer();
    }

    resume() {
        // 休息状态下继续
        this.stateManager.resumeTimer();
    }

    reset() {
        // 重置休息
        this.stateManager.resetTimer();
    }

    finish() {
        // 完成休息，自动开始工作
        this.stateManager.finishBreak();
    }

    skip() {
        // 跳过休息，中断休息
        this.stateManager.skipBreak();
    }

    acknowledge() {
        // 确认休息，最小化休息窗口
        this.stateManager.acknowledgeBreak();
    }

    immediateBreak() {
        // 休息状态下无法立即休息
        console.log('当前是休息状态，无法立即休息');
    }
}

module.exports = BreakState;