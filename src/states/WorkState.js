const TimerState = require('./TimerState');

class WorkState extends TimerState {
    constructor(stateManager) {
        super(stateManager);
        this.name = 'work';
    }

    start() {
        // 工作状态下已经开始，不需要再次开始
        console.log('当前是工作状态，已经开始');
    }

    pause() {
        // 暂停工作
        this.stateManager.pauseTimer();
    }

    resume() {
        // 继续工作
        this.stateManager.resumeTimer();
    }

    reset() {
        // 重置工作
        this.stateManager.resetTimer();
    }

    finish() {
        // 完成工作，自动开始休息
        this.stateManager.finishWork();
    }

    skip() {
        // 工作状态下无法跳过
        console.log('当前是工作状态，无法跳过');
    }

    acknowledge() {
        // 工作状态下无法确认
        console.log('当前是工作状态，无法确认');
    }

    immediateBreak() {
        // 立即休息，中断工作
        this.stateManager.startBreak(true);
    }
}

module.exports = WorkState;