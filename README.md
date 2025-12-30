# 程序员健康管理助手

一个AI编写的基于 Electron 开发的桌面应用程序，帮助程序员定期休息，保持健康的工作习惯。

## 功能特性

- ⏰ **工作-休息计时器**：采用番茄工作法原理，帮助你合理安排工作和休息时间
- ⚙️ **自定义时长**：可自由设置工作时长和休息时长
- 🎯 **灵活控制**：支持开始、暂停、重置计时器
- 🚀 **立即休息**：可随时切换到休息状态
- 📊 **统计功能**：记录并可视化你的工作和休息数据
- 🎨 **简洁界面**：直观易用的用户界面

## 技术栈

- **框架**：Electron
- **语言**：HTML / CSS / JavaScript
- **图表库**：Chart.js
- **构建工具**：electron-builder

## 项目结构

```
programmer-health-assistant/
├── assets/             # 静态资源
│   └── icons/          # 应用图标
├── src/                # 源代码
│   ├── states/         # 状态模式实现
│   └── TimerStateManager.js  # 状态管理器
├── styles/             # CSS 样式文件
├── main.js             # Electron 主进程
├── renderer.js         # 渲染进程脚本
├── dataManager.js      # 数据管理
├── stats.js            # 统计功能
├── index.html          # 主界面
├── break.html          # 休息界面
├── stats.html          # 统计界面
└── package.json        # 项目配置
```

## 安装与运行

### 前置要求

- Node.js 16.x 或更高版本
- npm 或 yarn 包管理器

### 安装依赖

```bash
npm install
```

### 运行开发版本

```bash
npm start
# 或
npm run dev
```

### 构建可执行文件

#### Windows

```bash
npm run build:win
```

#### macOS

```bash
npm run build:mac
```

#### Linux

```bash
npm run build:linux
```

构建后的文件将输出到 `dist` 目录。

## 使用说明

1. **设置时长**：在主界面上设置你想要的工作时长和休息时长
2. **开始工作**：点击"开始工作"按钮启动计时器
3. **控制计时**：
   - 点击"暂停"按钮暂停计时
   - 点击"立即休息"按钮切换到休息状态
   - 点击"重置计时器"按钮重置当前计时
4. **查看统计**：点击"查看统计"按钮查看你的工作和休息数据

## 状态管理

应用使用状态模式实现计时器的不同状态：

- **ReadyState**：准备状态
- **WorkState**：工作状态
- **BreakState**：休息状态

## 数据统计

应用会记录你的工作和休息数据，包括：
- 工作时长
- 休息时长
- 完成的工作周期数

统计数据将以图表形式展示，帮助你了解自己的工作习惯。

## 许可证

本项目采用 **MIT 许可证**，这是最宽松的开源许可证之一，允许：

- 商业使用
- 分发
- 修改
- 私人使用

只要在软件的所有副本或主要部分中包含原始版权声明和许可证声明即可。

完整的许可证文本请见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 作者

Mlin
