# 智能农业监测与AI预测系统 (前端)

## 项目简介
本项目是基于 Vue 3 + Vite + Element Plus 开发的智能农业监测系统前端。
主要功能包括：
- **实时监控**：展示空气温湿度、光照、土壤温湿度、CO2 等环境数据。
- **告警系统**：当环境数据超出设定阈值时自动告警。
- **控制中心**：支持手动/自动控制模式切换，设备开关控制，以及阈值配置。
- **历史数据**：查询和分析历史环境数据趋势。
- **AI 预测**：展示未来环境预测趋势及智能控制建议。

## 技术栈
- **核心框架**: Vue 3
- **构建工具**: Vite
- **UI 组件库**: Element Plus
- **图表库**: ECharts 5
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **网络请求**: Axios
- **实时通信**: WebSocket

## 快速开始

### 1. 环境准备
确保您的电脑上已安装 Node.js (推荐 v16+)。
如果尚未安装，请访问 [Node.js 官网](https://nodejs.org/) 下载并安装。

### 2. 安装依赖
在项目根目录下打开终端 (CMD 或 PowerShell)，运行以下命令安装依赖：

```bash
npm install
```

### 3. 启动项目
依赖安装完成后，运行以下命令启动开发服务器：

```bash
npm run dev
```

启动成功后，访问控制台输出的本地地址 (通常是 http://localhost:3000) 即可预览。

## 目录结构
```
src/
├── api/            # API 接口封装
├── assets/         # 静态资源
├── components/     # 公共组件 (Layout等)
├── router/         # 路由配置
├── store/          # Pinia 状态管理
├── utils/          # 工具类 (WebSocket等)
├── views/          # 页面视图
│   ├── Dashboard.vue   # 实时监控
│   ├── Control.vue     # 控制中心
│   ├── History.vue     # 历史数据
│   └── Prediction.vue  # AI 预测
├── App.vue         # 根组件
├── main.js         # 入口文件
└── style.css       # 全局样式
```

## 注意事项
- 当前数据均为模拟数据 (Mock)，如需对接后端，请修改 `vite.config.js` 中的代理配置及 `src/api` 下的接口调用。
- WebSocket 地址可在 `src/utils/websocket.js` 中配置。
