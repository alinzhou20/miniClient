import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const useSSL = env.VITE_USE_SSL === 'true'
  
  // 调试信息
  console.log('🔧 Vite配置调试信息:')
  console.log('   - Mode:', mode)
  console.log('   - VITE_USE_SSL:', env.VITE_USE_SSL)
  console.log('   - useSSL:', useSSL)
  
  // SSL配置
  let httpsConfig: any = false
  if (useSSL) {
    try {
      const keyPath = resolve(__dirname, 'ssl/key.pem')
      const certPath = resolve(__dirname, 'ssl/cert.pem')
      
      console.log('   - SSL文件路径:')
      console.log('     - Key:', keyPath)
      console.log('     - Cert:', certPath)
      console.log('     - Key存在:', existsSync(keyPath))
      console.log('     - Cert存在:', existsSync(certPath))
      
      if (existsSync(keyPath) && existsSync(certPath)) {
        httpsConfig = {
          key: readFileSync(keyPath),
          cert: readFileSync(certPath),
        }
        console.log('🔒 启用HTTPS模式 - 端口: 5174')
      } else {
        console.warn('⚠️ SSL证书文件不存在，使用HTTP模式')
        console.warn('请运行 pnpm ssl:generate 生成SSL证书')
        httpsConfig = false
      }
    } catch (error) {
      console.warn('⚠️ 无法加载SSL证书，使用HTTP模式:', error)
      console.warn('请运行 pnpm ssl:generate 生成SSL证书')
      httpsConfig = false
    }
  } else {
    console.log('🌐 使用HTTP模式 - 端口: 5173')
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: useSSL ? 5174 : 5173, // HTTPS使用不同端口避免冲突
      host: true,
      cors: true,
      https: httpsConfig,
      proxy: {
        '/socket.io': {
          target: 'http://localhost:3000', // 始终连接到HTTP后端
          ws: true,
          changeOrigin: true,
          secure: false, // 允许自签名证书
        }
      }
    },
    // 开发环境优化
    optimizeDeps: {
      include: ['vue', 'pinia', 'element-plus', 'socket.io-client']
    }
  }
})
