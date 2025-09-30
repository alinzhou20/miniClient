<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus } from '@/store/status'
import { useSocket } from '@/utils/socket'
import { ElMessage } from 'element-plus'
import { EntityMode } from '@/types'

const router = useRouter()
const status = useStatus()
const socket = useSocket()

// 自动登录
onMounted(async () => {
  const currentPath = router.currentRoute.value.path
  const isInLoginPage = currentPath.includes('/login')
  
  if (!isInLoginPage) {
    try {
      const savedUser = localStorage.getItem('user')
      if (!savedUser) {
        router.push('/login')
        return
      }

      const user = JSON.parse(savedUser)

      if (user.type === 'student') {
        await socket.connect({
          type: 'student',
          mode: EntityMode.GROUP,
          groupNo: user.groupNo
        })
      } else {
        await socket.connect({ type: 'teacher' })
      }

      status.userStatus = user
      console.log('[App] 自动登录成功')
    } catch (error) {
      console.error('[App] 自动登录失败:', error)
      localStorage.removeItem('user')
      router.push('/login')
    }
  }

  // 监听被踢下线
  socket.on('off_line', (data: any) => {
    ElMessage.warning(data?.message || '您的账号在其他地方登录')
    status.userStatus = null
    localStorage.removeItem('user')
    setTimeout(() => router.push('/login'), 1500)
  })
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f5f7fa;
}

#app {
  width: 100%;
  height: 100%;
  background: #F5F5F0;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Element Plus 样式覆盖 */
.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.el-button {
  border-radius: 6px;
}

.el-input__wrapper {
  border-radius: 6px;
}

.el-textarea__inner {
  border-radius: 6px;
}
</style>