<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus, useSocket } from '@/store'

const router = useRouter()
const {userStatus, activityStatus, mode} = useStatus()
const {socket, connect} = useSocket()

// 自动登录
onMounted(async () => {
  
  if (socket == null && userStatus !== null) {
    try {
      connect({
        type: userStatus.type,
        mode: mode,
        groupNo: userStatus.groupNo
      })
      router.push(`/${userStatus.type}/activity${activityStatus?.now ?? 0}`)
    } catch (error) {
      router.push('/login')
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