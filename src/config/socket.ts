// Socket.IO 连接配置
export interface SocketConfig {
  url: string
  namespace: string
}

// 默认配置
export const defaultSocketConfig: SocketConfig = {
  url: 'http://localhost:3000',
  namespace: '/classroom'
}

// 环境配置
export const getSocketConfig = (): SocketConfig => {
  const isDev = import.meta.env.DEV
  const baseUrl = import.meta.env.VITE_SOCKET_URL || (isDev ? 'http://localhost:3000' : 'https://your-production-domain.com')
  
  return {
    ...defaultSocketConfig,
    url: baseUrl
  }
}
