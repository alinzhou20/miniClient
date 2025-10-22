<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useStuStatus, useTeaStatus } from '@/store/status'
import { useSocket } from '@/store/socket'

// 自动重连：应用启动时检查是否有已登录的用户
onMounted(async () => {
  const socket = useSocket()
  const user = useStuStatus().user || useTeaStatus().user
  
  if (user && !socket.connected) {
    try {
      await socket.connect(user)
    } catch (error) {
      console.error('[App] 自动重连失败:', error)
    }
  }
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