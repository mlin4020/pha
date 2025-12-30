const TimerState = require('./TimerState');

class ReadyState extends TimerState {
    constructor(stateManager) {
        super(stateManager);
        this.name = 'ready';
    }

    start() {
        // 从准备状态开始工作
        this.stateManager.startWork();
    }

    pause() {
        // 准备状态下不需要暂停
        console.log('当前是准备状态，不需要暂停');
    }

    resume() {
        // 准备状态下不需要继续
        console.log('当前是准备状态，不需要继续');
    }

    reset() {
        // 准备状态下重置无操作
        console.log('当前是准备状态，重置无操作');
    }

    finish() {
        // 准备状态下无法完成
        console.log('当前是准备状态，无法完成');
    }

    skip() {
        // 准备状态下无法跳过
        console.log('当前是准备状态，无法跳过');
    }

    acknowledge() {
        // 准备状态下无法确认
        console.log('当前是准备状态，无法确认');
    }

    immediateBreak() {
        // 准备状态下无法立即休息
        console.log('当前是准备状态，无法立即休息');
    }
}

module.exports = ReadyState;