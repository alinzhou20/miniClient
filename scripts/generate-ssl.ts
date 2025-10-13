#!/usr/bin/env tsx

/**
 * SSL证书生成脚本
 * 
 * 作用：
 * 1. 使用mkcert生成本地开发用的SSL证书
 * 2. 创建ssl目录存放证书文件
 * 3. 配置本地域名（localhost, 127.0.0.1, 本地IP）
 * 4. 验证证书生成是否成功
 */

import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { networkInterfaces } from 'os'
import { fileURLToPath } from 'url'

// ES模块中获取当前文件目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 项目根目录
const PROJECT_ROOT = resolve(__dirname, '..')
// SSL证书存放目录
const SSL_DIR = join(PROJECT_ROOT, 'ssl')

console.log('🔒 开始生成SSL证书...\n')

/**
 * 获取本地IP地址
 * 作用：自动获取本机IP地址，以便在局域网内访问HTTPS服务
 */
function getLocalIP(): string[] {
  const nets = networkInterfaces()
  const ips: string[] = []
  
  for (const name of Object.keys(nets)) {
    const netInfo = nets[name]
    if (!netInfo) continue
    
    for (const net of netInfo) {
      // 跳过内部地址和IPv6地址
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address)
      }
    }
  }
  
  return ips
}

/**
 * 检查mkcert是否已安装
 * 作用：确保系统已安装mkcert工具
 */
function checkMkcert(): boolean {
  try {
    execSync('mkcert --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * 创建SSL目录
 * 作用：确保ssl目录存在，用于存放生成的证书文件
 */
function ensureSSLDir(): void {
  if (!existsSync(SSL_DIR)) {
    mkdirSync(SSL_DIR, { recursive: true })
    console.log('📁 创建SSL目录:', SSL_DIR)
  }
}

/**
 * 生成SSL证书
 * 作用：使用mkcert生成本地开发用的SSL证书
 */
function generateCertificates(): void {
  const localIPs = getLocalIP()
  
  // 配置要支持的域名和IP
  const domains = [
    'localhost',
    '127.0.0.1',
    '117.72.63.157',
    '172.16.0.5',
    '::1',
    ...localIPs
  ]
  
  console.log('🌐 将为以下域名/IP生成证书:')
  domains.forEach(domain => console.log(`   - ${domain}`))
  console.log()
  
  try {
    // 生成证书文件
    const keyFile = join(SSL_DIR, 'key.pem')
    const certFile = join(SSL_DIR, 'cert.pem')
    
    // 使用mkcert生成证书
    const command = `mkcert -key-file "${keyFile}" -cert-file "${certFile}" ${domains.join(' ')}`
    
    console.log('🔧 执行命令:', command)
    execSync(command, { 
      stdio: 'inherit',
      cwd: PROJECT_ROOT
    })
    
    console.log('✅ SSL证书生成成功!')
    console.log(`   - 私钥文件: ${keyFile}`)
    console.log(`   - 证书文件: ${certFile}`)
    
  } catch (error) {
    console.error('❌ 证书生成失败:', error)
    process.exit(1)
  }
}

/**
 * 创建SSL配置信息文件
 * 作用：记录SSL配置信息，便于其他脚本使用
 */
function createSSLConfig(): void {
  const config = {
    keyFile: join(SSL_DIR, 'key.pem'),
    certFile: join(SSL_DIR, 'cert.pem'),
    createdAt: new Date().toISOString(),
    domains: [
      'localhost',
      '127.0.0.1',
      '::1',
      ...getLocalIP()
    ]
  }
  
  const configFile = join(SSL_DIR, 'config.json')
  writeFileSync(configFile, JSON.stringify(config, null, 2))
  console.log('📄 SSL配置信息已保存到:', configFile)
}

/**
 * 验证证书文件
 * 作用：检查生成的证书文件是否有效
 */
function validateCertificates(): void {
  const keyFile = join(SSL_DIR, 'key.pem')
  const certFile = join(SSL_DIR, 'cert.pem')
  
  if (!existsSync(keyFile) || !existsSync(certFile)) {
    console.error('❌ 证书文件生成失败')
    process.exit(1)
  }
  
  try {
    // 验证证书有效性
    execSync(`openssl x509 -in "${certFile}" -text -noout`, { stdio: 'ignore' })
    console.log('✅ 证书文件验证成功')
  } catch {
    console.warn('⚠️  无法验证证书（可能系统未安装openssl，但证书文件已生成）')
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    console.log('📋 开始SSL配置流程...')
    
    // 1. 检查mkcert是否安装
    console.log('🔍 检查mkcert安装状态...')
    if (!checkMkcert()) {
      console.error('❌ mkcert未安装或未在PATH中')
      console.log('请先安装mkcert:')
      console.log('Windows: choco install mkcert 或 scoop install mkcert')
      console.log('macOS: brew install mkcert')
      console.log('Linux: 参考 https://github.com/FiloSottile/mkcert#installation')
      process.exit(1)
    }
    
    console.log('✅ mkcert已安装')
    
    // 2. 创建SSL目录
    console.log('📁 创建SSL目录...')
    ensureSSLDir()
    
    // 3. 生成SSL证书
    console.log('🔑 生成SSL证书...')
    generateCertificates()
    
    // 4. 创建配置文件
    console.log('📄 创建配置文件...')
    createSSLConfig()
    
    // 5. 验证证书
    console.log('🔍 验证证书...')
    validateCertificates()
    
    console.log('\n🎉 SSL证书配置完成!')
    console.log('现在您可以使用以下命令启动HTTPS开发服务器:')
    console.log('   pnpm dev:ssl')
    console.log('\n或者设置环境变量:')
    console.log('   VITE_USE_SSL=true pnpm dev')
    
  } catch (error) {
    console.error('❌ SSL配置过程中出现错误:', error)
    console.error('错误堆栈:', error instanceof Error ? error.stack : String(error))
    process.exit(1)
  }
}

// 执行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})

export { main as generateSSL }
