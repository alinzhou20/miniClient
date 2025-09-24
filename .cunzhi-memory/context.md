# 项目上下文信息

- 项目已完全移除Electron桌面应用功能，回归纯Web应用。删除了electron/、release/、.cursor/、.cunzhi-memory/、docs/、dist/等目录。移除了electron相关依赖包（electron、electron-builder、concurrently、wait-on）。简化了package.json配置和vite.config.ts。保留了所有核心教学功能：Activity1-4、Socket.IO通信、AI助手（CozeAPI）、摄像头拍照功能。项目现在结构精简，仅包含：.env、.gitignore、index.html、node_modules、package.json、pnpm-lock.yaml、src、tsconfig.json、vite.config.ts。
