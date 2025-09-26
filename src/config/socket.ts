// Socket.IO 连接配置
export interface SocketConfig {
  url: string
  namespace: string
}

// 默认配置
export const defaultSocketConfig: SocketConfig = {
  url: '', // 默认使用相对路径
  namespace: '/classroom'
}

// 环境配置
export const getSocketConfig = (): SocketConfig => {
  const isDev = import.meta.env.DEV
  
  // 开发环境使用相对路径，通过Vite代理转发
  // 生产环境使用完整URL
  const baseUrl = isDev 
    ? '' // 空字符串表示使用当前页面的协议和域名，通过Vite代理转发
    : (import.meta.env.VITE_SOCKET_URL || 'https://your-production-domain.com')
  
  const config = {
    ...defaultSocketConfig,
    url: baseUrl
  }
  
  // 调试信息
  console.log('🔗 Socket.IO配置调试信息:')
  console.log('   - isDev:', isDev)
  console.log('   - VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL)
  console.log('   - baseUrl:', baseUrl)
  console.log('   - namespace:', config.namespace)
  console.log('   - 完整连接URL:', baseUrl + config.namespace)
  
  return config
}
