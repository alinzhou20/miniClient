# 🔒 SSL证书配置指南

本指南详细说明如何在开发环境中配置和使用HTTPS。

## 📋 目录
- [为什么需要HTTPS](#为什么需要HTTPS)
- [环境要求](#环境要求)  
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [常见问题](#常见问题)

## 🚀 为什么需要HTTPS？

1. **安全性提升**：加密数据传输，防止中间人攻击
2. **PWA支持**：许多Web API需要HTTPS环境
3. **生产模拟**：更好地模拟生产环境
4. **摄像头权限**：现代浏览器要求HTTPS才能访问摄像头（Activity4需要）
5. **WebSocket安全**：支持WSS安全WebSocket连接

## 🛠️ 环境要求

- ✅ Node.js >= 20
- ✅ pnpm 包管理器  
- ✅ mkcert 工具（已安装）
- ✅ 操作系统支持（Windows/macOS/Linux）

## ⚡ 快速开始

### 1️⃣ 生成SSL证书

```bash
# 生成本地SSL证书
pnpm ssl:generate
```

**此命令的作用：**
- 使用mkcert生成本地可信任的SSL证书
- 自动配置localhost、127.0.0.1和本机IP地址
- 在 `ssl/` 目录下生成 `key.pem` 和 `cert.pem` 文件
- 创建配置文件记录证书信息

### 2️⃣ 启动HTTPS开发服务器

```bash
# 方式一：使用预配置脚本
pnpm dev:ssl

# 方式二：使用环境变量
VITE_USE_SSL=true pnpm dev
```

**访问地址：**
- HTTPS: https://localhost:5174
- 局域网: https://[你的IP]:5174

## 🔧 详细配置

### 环境变量配置

复制 `env.example` 为 `.env` 并配置：

```env
# 启用HTTPS (可选)
VITE_USE_SSL=true

# Socket.IO服务器地址
VITE_SOCKET_URL=http://localhost:3000

# 其他配置...
```

### SSL脚本详解

#### 📄 scripts/generate-ssl.ts

这个TypeScript脚本执行以下操作：

1. **环境检查**：验证mkcert是否已安装
2. **目录创建**：创建 `ssl/` 目录存放证书
3. **IP地址获取**：自动获取本机所有网络接口IP
4. **证书生成**：为以下域名生成证书：
   - localhost
   - 127.0.0.1
   - ::1 (IPv6本地回环)
   - 所有本机IP地址

5. **配置文件**：生成 `ssl/config.json` 记录证书信息
6. **验证检查**：验证生成的证书是否有效

#### 🎯 Vite配置详解

`vite.config.ts` 中的SSL配置：

```typescript
// 根据环境变量决定是否启用SSL
const useSSL = env.VITE_USE_SSL === 'true'

// HTTPS配置
let httpsConfig: any = false
if (useSSL) {
  // 读取SSL证书文件
  const keyPath = resolve(__dirname, 'ssl/key.pem')
  const certPath = resolve(__dirname, 'ssl/cert.pem')
  
  if (existsSync(keyPath) && existsSync(certPath)) {
    httpsConfig = {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    }
  }
}

// 服务器配置
server: {
  port: useSSL ? 5174 : 5173, // HTTPS使用不同端口
  https: httpsConfig,
  proxy: {
    '/socket.io': {
      target: useSSL ? 'https://localhost:3001' : 'http://localhost:3000',
      secure: false // 允许自签名证书
    }
  }
}
```

### Package.json脚本说明

```json
{
  "scripts": {
    "dev": "vite --host",              // HTTP开发服务器
    "dev:ssl": "VITE_USE_SSL=true vite --host", // HTTPS开发服务器
    "ssl:generate": "tsx scripts/generate-ssl.ts", // 生成SSL证书
    "ssl:clean": "rimraf ssl"          // 清理SSL证书
  }
}
```

### 依赖包说明

```json
{
  "devDependencies": {
    "tsx": "^4.20.5",     // 直接运行TypeScript脚本
    "rimraf": "^5.0.5"    // 跨平台删除文件/目录
  }
}
```

## 🔍 各步骤作用详解

### 1. TypeScript脚本执行 (tsx)
- **作用**：允许直接执行TypeScript脚本，无需预编译
- **优势**：开发便捷，支持ES模块和最新语法
- **用途**：执行SSL证书生成脚本

### 2. SSL证书生成 (mkcert)
- **作用**：生成浏览器信任的本地SSL证书
- **原理**：mkcert会将根证书安装到系统信任库
- **优势**：无需手动添加证书例外，浏览器直接信任

### 3. 环境变量配置
- **作用**：动态控制是否启用HTTPS
- **灵活性**：可以轻松在HTTP/HTTPS间切换
- **生产对齐**：环境变量方式与生产部署一致

### 4. Vite配置自动化
- **作用**：根据环境变量自动配置HTTPS
- **智能检测**：自动检查证书文件是否存在
- **错误处理**：证书不存在时回退到HTTP模式

### 5. 端口区分策略
- **HTTP端口**：5173（Vite默认）
- **HTTPS端口**：5174（避免端口冲突）
- **Socket代理**：自动匹配对应协议的后端地址

## 🛡️ 安全特性

1. **自签名证书**：仅用于本地开发，安全可控
2. **IP地址支持**：局域网内其他设备可通过IP访问
3. **证书隔离**：证书文件被.gitignore忽略，不会提交到版本控制
4. **自动清理**：提供清理命令删除证书文件

## ❓ 常见问题

### Q: 为什么需要不同的端口？
A: HTTP(5173)和HTTPS(5174)使用不同端口避免冲突，并且可以同时运行两种模式进行对比测试。

### Q: 证书过期怎么办？
A: mkcert生成的证书有效期很长，如果过期，重新运行 `pnpm ssl:generate` 即可。

### Q: 局域网设备无法访问？
A: 确保：
1. 防火墙允许对应端口
2. 使用设备实际IP地址访问
3. 证书包含了正确的IP地址（脚本会自动包含）

### Q: Socket.IO连接失败？
A: 检查：
1. 后端服务器是否支持HTTPS（可能需要后端也配置SSL）
2. 代理配置中的 `secure: false` 设置
3. 浏览器开发者工具中的网络错误信息

## 🧹 清理命令

```bash
# 删除所有SSL相关文件
pnpm ssl:clean

# 重新生成（清理后重新生成）
pnpm ssl:clean && pnpm ssl:generate
```

## 📝 文件结构

SSL配置后的项目结构：

```
miniClient/
├── scripts/
│   └── generate-ssl.ts     # SSL证书生成脚本
├── ssl/                    # SSL证书目录（.gitignore）
│   ├── key.pem            # 私钥文件
│   ├── cert.pem           # 证书文件
│   └── config.json        # 证书配置信息
├── env.example            # 环境变量示例
├── .env                   # 实际环境变量（用户创建）
└── vite.config.ts         # 支持HTTPS的Vite配置
```

## 🎉 完成！

现在您已经成功配置了HTTPS开发环境！享受更安全、更贴近生产环境的开发体验吧！

