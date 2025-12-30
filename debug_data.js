// 调试数据，用于测试统计功能
const fs = require('fs');
const path = require('path');

// 读取当前数据文件
const dataFile = path.join(__dirname, 'debug_stats.json');

// 如果文件不存在，创建一个测试数据文件
if (!fs.existsSync(dataFile)) {
    const testData = {
        records: [
            // 测试中断工作
            {
                id: 'test1',
                type: 'work',
                startTime: Date.now() - 3600000, // 1小时前
                endTime: Date.now() - 3000000, // 50分钟前
                duration: 3600, // 1小时
                status: 'completed'
            },
            {
                id: 'test2',
                type: 'work',
                startTime: Date.now() - 2700000, // 45分钟前
                endTime: Date.now() - 2400000, // 40分钟前
                duration: 1800, // 30分钟
                status: 'interrupted'
            },
            // 测试休息
            {
                id: 'test3',
                type: 'break',
                startTime: Date.now() - 2100000, // 35分钟前
                endTime: Date.now() - 1800000, // 30分钟前
                duration: 1800, // 30分钟
                status: 'completed'
            },
            {
                id: 'test4',
                type: 'break',
                startTime: Date.now() - 1500000, // 25分钟前
                endTime: Date.now() - 1200000, // 20分钟前
                duration: 1800, // 30分钟
                status: 'interrupted'
            }
        ],
        stats: {
            totalWorkSessions: 2,
            totalBreakSessions: 2,
            totalWorkTime: 5400,
            totalBreakTime: 3600,
            skippedBreaks: 1,
            interruptedWorkSessions: 1,
            completedWorkSessions: 1,
            completedBreakSessions: 1,
            averageWorkDuration: 2700,
            averageBreakDuration: 1800
        },
        lastUpdated: Date.now()
    };
    
    fs.writeFileSync(dataFile, JSON.stringify(testData, null, 2));
    console.log('测试数据文件已创建:', dataFile);
} else {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log('当前数据:', data);
}