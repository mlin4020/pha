const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 页面控制
  loadStatsPage: () => ipcRenderer.send('load-stats-page'),
  loadMainPage: () => ipcRenderer.send('load-main-page'),
  
  // 计时器控制
  startTimer: () => ipcRenderer.send('start-timer'),
  pauseTimer: () => ipcRenderer.send('pause-timer'),
  resumeTimer: () => ipcRenderer.send('resume-timer'),
  resetTimer: () => ipcRenderer.send('reset-timer'),
  
  // 时长设置
  setWorkDuration: (duration) => ipcRenderer.send('set-work-duration', duration),
  setBreakDuration: (duration) => ipcRenderer.send('set-break-duration', duration),
  
  // 休息控制
  skipBreak: () => ipcRenderer.send('skip-break'),
  acknowledgeBreak: () => ipcRenderer.send('acknowledge-break'),
  immediateBreak: () => ipcRenderer.send('immediate-break'),
  
  // 接收主进程事件
  onUpdateTime: (callback) => ipcRenderer.on('update-time', (event, time, isWorking, isBreak, isRunning) => callback(time, isWorking, isBreak, isRunning)),
  onTimerStarted: (callback) => ipcRenderer.on('timer-started', callback),
  onTimerPaused: (callback) => ipcRenderer.on('timer-paused', callback),
  onTimerReset: (callback) => ipcRenderer.on('timer-reset', callback),
  
  // 休息窗口事件
  onBreakDuration: (callback) => ipcRenderer.on('break-duration', (event, duration) => callback(duration)),
  onUpdateBreakTime: (callback) => ipcRenderer.on('update-break-time', (event, time) => callback(time)),
  
  // 统计数据相关
  getStats: () => ipcRenderer.invoke('get-stats'),
  getTodayStats: () => ipcRenderer.invoke('get-today-stats'),
  getWeekStats: () => ipcRenderer.invoke('get-week-stats'),
  getMonthStats: () => ipcRenderer.invoke('get-month-stats'),
  getRecords: () => ipcRenderer.invoke('get-records'),
  getTodayRecords: () => ipcRenderer.invoke('get-today-records'),
  getWeekRecords: () => ipcRenderer.invoke('get-week-records'),
  getMonthRecords: () => ipcRenderer.invoke('get-month-records'),
  
  // 移除事件监听
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('update-time');
    ipcRenderer.removeAllListeners('timer-started');
    ipcRenderer.removeAllListeners('timer-paused');
    ipcRenderer.removeAllListeners('timer-reset');
    ipcRenderer.removeAllListeners('break-duration');
    ipcRenderer.removeAllListeners('update-break-time');
  }
});
