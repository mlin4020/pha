// 状态基类
class TimerState {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.name = 'base';
    }

    start() {
        throw new Error('子类必须实现start方法');
    }

    pause() {
        throw new Error('子类必须实现pause方法');
    }

    resume() {
        throw new Error('子类必须实现resume方法');
    }

    reset() {
        throw new Error('子类必须实现reset方法');
    }

    finish() {
        throw new Error('子类必须实现finish方法');
    }

    skip() {
        throw new Error('子类必须实现skip方法');
    }

    acknowledge() {
        throw new Error('子类必须实现acknowledge方法');
    }

    immediateBreak() {
        throw new Error('子类必须实现immediateBreak方法');
    }
}

module.exports = TimerState;