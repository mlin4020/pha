const fs = require('fs');
const path = require('path');

class DataManager {
    constructor(app) {
        // 数据存储文件路径
        this.dataFile = path.join(app.getPath('userData'), 'healthStats.json');
        this.statsData = this.loadData();
    }

    // 初始化或加载现有数据
    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load stats data:', error);
        }

        // 初始数据结构
        return {
            records: [],
            stats: {
                totalWorkSessions: 0,
                totalBreakSessions: 0,
                totalWorkTime: 0, // 总工作时间（秒）
                totalBreakTime: 0, // 总休息时间（秒）
                skippedBreaks: 0, // 跳过休息次数
                interruptedWorkSessions: 0, // 中断的工作会话数
                completedWorkSessions: 0, // 完成的工作会话数
                completedBreakSessions: 0, // 完成的休息会话数
                interruptedBreakSessions: 0, // 中断的休息会话数
                averageWorkDuration: 0, // 平均工作时长（秒）
                averageBreakDuration: 0 // 平均休息时长（秒）
            },
            lastUpdated: Date.now()
        };
    }

    // 保存数据到文件
    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.statsData, null, 2));
            return true;
        } catch (error) {
            console.error('Failed to save stats data:', error);
            return false;
        }
    }

    // 记录工作会话开始
    startWorkSession(plannedDuration) {
        const session = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: 'work',
            startTime: Date.now(),
            plannedDuration: plannedDuration,
            status: 'active'
        };
        
        this.statsData.currentSession = session;
        return this.saveData();
    }

    // 记录工作会话结束
    endWorkSession(interrupted = false) {
        if (!this.statsData.currentSession || this.statsData.currentSession.type !== 'work') {
            return false;
        }

        const session = this.statsData.currentSession;
        session.endTime = Date.now();
        // 保留两位小数，精确到0.01秒
        session.duration = parseFloat(((session.endTime - session.startTime) / 1000).toFixed(2));
        session.status = interrupted ? 'interrupted' : 'completed';

        // 更新统计数据
        this.statsData.stats.totalWorkSessions++;
        this.statsData.stats.totalWorkTime += session.duration;
        
        if (interrupted) {
            this.statsData.stats.interruptedWorkSessions++;
        } else {
            this.statsData.stats.completedWorkSessions++;
        }

        // 更新平均值
        this.updateAverages();

        // 保存记录
        this.statsData.records.push(session);
        delete this.statsData.currentSession;

        return this.saveData();
    }

    // 记录休息会话开始
    startBreakSession(plannedDuration) {
        const session = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: 'break',
            startTime: Date.now(),
            plannedDuration: plannedDuration,
            status: 'active'
        };
        
        this.statsData.currentSession = session;
        return this.saveData();
    }

    // 记录休息会话结束
    endBreakSession(interrupted = false) {
        if (!this.statsData.currentSession || this.statsData.currentSession.type !== 'break') {
            return false;
        }

        const session = this.statsData.currentSession;
        session.endTime = Date.now();
        // 保留两位小数，精确到0.01秒
        session.duration = parseFloat(((session.endTime - session.startTime) / 1000).toFixed(2));
        session.status = interrupted ? 'interrupted' : 'completed';

        // 更新统计数据
        this.statsData.stats.totalBreakSessions++;
        this.statsData.stats.totalBreakTime += session.duration;
        
        if (interrupted) {
            this.statsData.stats.interruptedBreakSessions++;
        } else {
            this.statsData.stats.completedBreakSessions++;
        }

        // 更新平均值
        this.updateAverages();

        // 保存记录
        this.statsData.records.push(session);
        delete this.statsData.currentSession;

        return this.saveData();
    }

    // 记录跳过休息
    recordSkippedBreak() {
        this.statsData.stats.skippedBreaks++;
        return this.saveData();
    }

    // 结束当前会话（自动判断会话类型）
    endCurrentSession(interrupted = false) {
        if (!this.statsData.currentSession) {
            return false;
        }

        if (this.statsData.currentSession.type === 'work') {
            return this.endWorkSession(interrupted);
        } else if (this.statsData.currentSession.type === 'break') {
            return this.endBreakSession(interrupted);
        }
        return false;
    }

    // 观察者接口 - 处理状态变化事件
    onStateChange(event) {
        // 可以在这里添加状态变化的额外处理逻辑
        // 目前状态转换的统计已经在endCurrentSession中处理
        console.log('状态变化事件:', event);
    }

    // 更新平均值
    updateAverages() {
        const { stats } = this.statsData;
        
        stats.averageWorkDuration = stats.totalWorkSessions > 0 
            ? parseFloat((stats.totalWorkTime / stats.totalWorkSessions).toFixed(2)) 
            : 0;
        
        stats.averageBreakDuration = stats.totalBreakSessions > 0 
            ? parseFloat((stats.totalBreakTime / stats.totalBreakSessions).toFixed(2)) 
            : 0;
    }

    // 获取统计数据
    getStats() {
        return { ...this.statsData.stats };
    }

    // 获取所有记录
    getRecords() {
        return [...this.statsData.records];
    }

    // 获取今日记录
    getTodayRecords() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        return this.statsData.records.filter(record => record.startTime >= todayTimestamp);
    }

    // 获取本周记录
    getWeekRecords() {
        const today = new Date();
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        firstDayOfWeek.setHours(0, 0, 0, 0);
        const weekStartTimestamp = firstDayOfWeek.getTime();

        return this.statsData.records.filter(record => record.startTime >= weekStartTimestamp);
    }

    // 获取本月记录
    getMonthRecords() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthStartTimestamp = firstDayOfMonth.getTime();

        return this.statsData.records.filter(record => record.startTime >= monthStartTimestamp);
    }

    // 获取今日统计
    getTodayStats() {
        return this.calculateStatsForRecords(this.getTodayRecords());
    }

    // 获取本周统计
    getWeekStats() {
        return this.calculateStatsForRecords(this.getWeekRecords());
    }

    // 获取本月统计
    getMonthStats() {
        return this.calculateStatsForRecords(this.getMonthRecords());
    }

    // 为给定记录计算统计数据
    calculateStatsForRecords(records) {
        const stats = {
            totalWorkSessions: 0,
            totalBreakSessions: 0,
            totalWorkTime: 0,
            totalBreakTime: 0,
            skippedBreaks: 0,
            interruptedWorkSessions: 0,
            completedWorkSessions: 0,
            completedBreakSessions: 0,
            interruptedBreakSessions: 0,
            averageWorkDuration: 0,
            averageBreakDuration: 0
        };

        records.forEach(record => {
            if (record.type === 'work') {
                stats.totalWorkSessions++;
                stats.totalWorkTime += record.duration;
                
                if (record.status === 'interrupted') {
                    stats.interruptedWorkSessions++;
                } else {
                    stats.completedWorkSessions++;
                }
            } else if (record.type === 'break') {
                stats.totalBreakSessions++;
                stats.totalBreakTime += record.duration;
                
                if (record.status === 'interrupted') {
                    stats.interruptedBreakSessions++;
                } else {
                    stats.completedBreakSessions++;
                }
            }
        });

        // 计算平均值，保留两位小数
        stats.averageWorkDuration = stats.totalWorkSessions > 0 
            ? parseFloat((stats.totalWorkTime / stats.totalWorkSessions).toFixed(2)) 
            : 0;
        
        stats.averageBreakDuration = stats.totalBreakSessions > 0 
            ? parseFloat((stats.totalBreakTime / stats.totalBreakSessions).toFixed(2)) 
            : 0;

        return stats;
    }

    // 获取工作/休息比例
    getWorkBreakRatio() {
        const total = this.statsData.stats.totalWorkTime + this.statsData.stats.totalBreakTime;
        if (total === 0) return { work: 0, break: 0 };
        
        return {
            work: Math.round((this.statsData.stats.totalWorkTime / total) * 100),
            break: Math.round((this.statsData.stats.totalBreakTime / total) * 100)
        };
    }
}

module.exports = DataManager;