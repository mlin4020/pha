const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');

// 导入数据管理模块和状态管理器
const DataManager = require('./dataManager');
const TimerStateManager = require('./src/TimerStateManager');

let dataManager;
let stateManager;

// 只在开发环境中加载热更新支持
if (process.env.NODE_ENV === 'development') {
  try {
    const chokidar = require('chokidar');
    
    // 使用绝对路径监听文件变化
    const watchPaths = [
      path.join(__dirname, '*.html'),
      path.join(__dirname, 'styles', '**', '*.css'),
      path.join(__dirname, '*.js'),
      path.join(__dirname, 'src', '**', '*.js')
    ];
    
    // 使用chokidar手动监听文件变化
    const watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules|dist|assets/,
      ignoreInitial: true,
      usePolling: true, // 使用轮询模式，确保在Windows系统上正常工作
      interval: 100, // 轮询间隔
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });
    
    // 监听文件变化事件
    watcher.on('change', (filePath) => {
      console.log(`文件已更改: ${filePath}`);
      if (mainWindow) {
        // 重新加载渲染进程
        mainWindow.reload();
        console.log('渲染进程已重新加载');
      }
    });
    
    console.log('热更新配置已加载，使用chokidar监听文件变化...');
    console.log('监听的文件路径:', watchPaths);
  } catch (error) {
    console.error('热更新配置错误:', error);
    console.error('错误堆栈:', error.stack);
  }
}

let mainWindow;
let breakWindow;
let tray = null;

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    resizable: true,
    maximizable: true,
    icon: path.join(__dirname, 'assets/icons/icon.svg')
  });

  mainWindow.loadFile('index.html');

  // 窗口关闭时退出应用
  mainWindow.on('close', () => {
    app.quitting = true;
    mainWindow = null;
    app.quit();
    console.log('应用已退出');
  });

  // 窗口显示时更新倒计时和运行状态
  mainWindow.on('show', () => {
    // 使用状态管理器的UI回调更新
    stateManager.updateUI();
  });

  // 设置状态管理器的UI更新回调
  stateManager.setUpdateUICallback((status) => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.webContents.send('update-time', status.time, status.isWorking, status.isBreak, status.isRunning);
      
      // 更新托盘提示
      if (tray) {
        const minutes = Math.floor(status.time / 60);
        const seconds = status.time % 60;
        const tooltip = status.isWorking ? `剩余时间: ${minutes}:${seconds.toString().padStart(2, '0')}` : `休息剩余: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        tray.setToolTip(tooltip);
      }
    }
  });
  
  // 设置休息窗口更新回调
  stateManager.setBreakWindowCallback((time) => {
    if (breakWindow && breakWindow.isVisible()) {
      breakWindow.webContents.send('update-break-time', time);
    }
  });

  // 监听应用激活事件，确保点击任务栏图标时能显示窗口
  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
      console.log('应用已激活，显示主窗口');
    }
  });
}

// 创建休息窗口
function createBreakWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  breakWindow = new BrowserWindow({
    width: width,
    height: height,
    fullscreen: true,
    alwaysOnTop: true,
    kiosk: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  breakWindow.loadFile('break.html');

  // 发送休息时长到渲染进程
  breakWindow.webContents.on('did-finish-load', () => {
    breakWindow.webContents.send('break-duration', stateManager.breakDuration);
  });

  breakWindow.on('closed', () => {
    breakWindow = null;
  });
}

// 配置应用后台运行功能
function setupBackgroundRun() {
  console.log('配置应用运行模式');
  
  // 确保应用在激活时能显示主窗口
  app.on('activate', () => {
    console.log('应用被激活');
    if (mainWindow) {
      console.log('显示主窗口');
      mainWindow.show();
    }
  });
}

// 应用就绪事件
app.whenReady().then(() => {
  // 初始化数据管理器
  dataManager = new DataManager(app);
  
  // 初始化状态管理器
  stateManager = new TimerStateManager(dataManager);
  
  // 设置状态观察者
  setupStateObservers();
  
  createMainWindow();
  setupBackgroundRun();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// 所有窗口关闭事件已在createTray函数中处理，这里不再重复

// 应用退出事件
app.on('before-quit', () => {
  app.quitting = true;
});

// 状态管理器的观察者回调，用于处理需要UI交互的状态变化
function setupStateObservers() {
  stateManager.addObserver({
    onStateChange: (event) => {
      if (event.type === 'acknowledgeBreak') {
        // 最小化休息窗口
        if (breakWindow) {
          breakWindow.hide();
          console.log('休息窗口已最小化，继续后台休息');
        }
      } else if (event.type === 'stateChange') {
        // 当状态变为休息时，创建休息窗口
        if (event.newState === 'break') {
          createBreakWindow();
        }
        // 当状态从休息变为其他时，关闭休息窗口
        if (event.oldState === 'break' && event.newState !== 'break') {
          if (breakWindow) {
            breakWindow.close();
            breakWindow = null;
          }
        }
      }
    }
  });
}

// IPC 事件处理 - 页面加载
ipcMain.on('load-stats-page', () => {
  mainWindow.loadFile('stats.html');
});

ipcMain.on('load-main-page', () => {
  mainWindow.loadFile('index.html');
});

// IPC 事件处理 - 使用状态管理器处理所有事件
ipcMain.on('start-timer', () => {
  stateManager.start();
});

ipcMain.on('pause-timer', () => {
  stateManager.pause();
});

ipcMain.on('resume-timer', () => {
  stateManager.resume();
});

ipcMain.on('reset-timer', () => {
  stateManager.resetTimer();
});

ipcMain.on('set-work-duration', (event, duration) => {
  stateManager.setWorkDuration(duration);
});

ipcMain.on('set-break-duration', (event, duration) => {
  stateManager.setBreakDuration(duration);
});

ipcMain.on('skip-break', () => {
  // 记录跳过休息
  dataManager.recordSkippedBreak();
  stateManager.skip();
});

ipcMain.on('acknowledge-break', () => {
  // 使用状态管理器处理确认休息
  stateManager.acknowledge();
});

ipcMain.on('immediate-break', () => {
  // 立即开始休息，跳过当前工作周期
  stateManager.immediateBreak();
  console.log('立即开始休息');
});

// 统计数据相关 IPC 事件
ipcMain.handle('get-stats', () => {
  return dataManager.getStats();
});

ipcMain.handle('get-today-stats', () => {
  return dataManager.getTodayStats();
});

ipcMain.handle('get-week-stats', () => {
  return dataManager.getWeekStats();
});

ipcMain.handle('get-month-stats', () => {
  return dataManager.getMonthStats();
});

ipcMain.handle('get-records', () => {
  return dataManager.getRecords();
});

ipcMain.handle('get-today-records', () => {
  return dataManager.getTodayRecords();
});

ipcMain.handle('get-week-records', () => {
  return dataManager.getWeekRecords();
});

ipcMain.handle('get-month-records', () => {
  return dataManager.getMonthRecords();
});
