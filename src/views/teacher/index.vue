<template>
  <div class="page">
    <!-- 顶部标题横幅 + 活动按钮 -->
    <div class="banner">
      <div class="banner-inner">
        <div class="banner-badge">第 5 课</div>
        <h1 class="title">课堂看板</h1>
        
        <!-- 活动按钮区 -->
        <div class="activity-btns">
          <button 
            v-for="activity in activities" 
            :key="activity.id"
            class="activity-btn"
            :class="{ active: currentActivity === activity.id.toString() }"
            @click="selectActivity(activity.id)"
          >
            {{ activity.name }}
          </button>
        </div>
        
        <div class="spacer"></div>
        
        <el-button @click="handleLogout" class="logout-btn">
          <el-icon :size="20"><Fold /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 统一内容区 -->
    <div class="content-box">
      <!-- 子路由内容 -->
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStatus } from '@/store/status'
import { useSocket } from '@/utils/socket'
import { EntityMode } from '@/types'
import { ElMessage } from 'element-plus'
import { Fold } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const socket = useSocket()
const status = useStatus()

const activities = [
  { id: 0, name: '投票' },
  { id: 1, name: '活动一' },
  { id: 2, name: '活动二' },
  { id: 3, name: '活动三' }
]

// 当前活动
const currentActivity = computed(() => {
  const p = String(route.path || '')
  if (p.includes('activity3')) return '3'
  if (p.includes('activity2')) return '2'
  if (p.includes('activity1')) return '1'
  if (p.includes('activity0')) return '0'
  return '0'
})

const selectActivity = (id: number) => {
  // 更新当前活动
  status.activityStatus.now = id
  
  // 激活该活动
  ;(status.activityStatus as any)[id] = true
  
  console.log('[Teacher] 更新活动状态:', status.activityStatus)
  
  // 广播活动状态给所有学生
  try {
    socket.dispatch({
      mode: EntityMode.GROUP,
      messageType: 'change_activity',
      activityIndex: '-1',
      data: {
        activityStatus: status.activityStatus
      },
      from: null,
      to: {}
    })
    
    const activityName = id === 0 ? '投票' : id === 1 ? '活动一' : id === 2 ? '活动二' : '活动三'
    ElMessage.success(`已切换到${activityName}并通知学生`)
  } catch (error) {
    console.error('[Teacher] 广播活动状态失败:', error)
  }
  
  // 跳转到对应活动
  router.push(`/teacher/activity${id}`)
}

const handleLogout = () => {
  socket.disconnect()
  status.userStatus = null
  localStorage.removeItem('user')
  router.push('/login')
  ElMessage.success('已退出登录')
}

// 25个小组数据管理
const GROUP_COUNT = 25
const groups = reactive(Array.from({ length: GROUP_COUNT }, () => ({ left: '', right: '' })))

type ActivityKey = 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7'
const surveyDone = reactive(new Set<string>())
const groupDoneSets = reactive<Record<ActivityKey, Set<string>>>({
  a1: new Set<string>(),
  a2: new Set<string>(),
  a3: new Set<string>(),
  a4: new Set<string>(),
  a5: new Set<string>(),
  a6: new Set<string>(),
  a7: new Set<string>()
})

const studentKey = (groupNo: string, studentNo: string) => `${groupNo}-${studentNo}`

type LatestDrawing = { strokes: any[]; width: number; height: number; at: number }
const drawStore = reactive(new Map<string, LatestDrawing>())

function recordDrawing(groupNo: string, studentNo: string, payload: { strokes: any[]; width?: number; height?: number }) {
  const key = studentKey(groupNo, studentNo)
  drawStore.set(key, {
    strokes: payload.strokes || [],
    width: Number(payload.width) || 0,
    height: Number(payload.height) || 0,
    at: Date.now()
  })
}

function placeStudent(groupNo: string, studentNo: string) {
  let g = parseInt(groupNo, 10)
  if (!Number.isFinite(g) || g < 1) g = 1
  if (g > GROUP_COUNT) g = GROUP_COUNT
  const s = String(studentNo)

  const grp = groups[g - 1]
  if (!grp.left && !grp.right) {
    grp.left = s
    return
  }
  if (grp.left && !grp.right) {
    const l = parseInt(grp.left, 10) || 0
    const ns = parseInt(s, 10) || 0
    if (ns < l) {
      grp.right = grp.left
      grp.left = s
    } else if (ns !== l) {
      grp.right = s
    }
    return
  }
  if (!grp.left && grp.right) {
    const r = parseInt(grp.right, 10) || 0
    const ns = parseInt(s, 10) || 0
    if (ns < r) {
      grp.left = s
    } else if (ns !== r) {
      grp.left = grp.right
      grp.right = s
    }
    return
  }
  if (grp.left && grp.right) {
    const l = parseInt(grp.left, 10) || 0
    const r = parseInt(grp.right, 10) || 0
    const ns = parseInt(s, 10) || 0
    if (ns === l || ns === r) return
    if (ns < l) {
      groups[g - 1] = { left: s, right: grp.left }
    } else if (ns > r) {
      groups[g - 1].right = s
    } else if (ns > l && ns < r) {
      groups[g - 1].right = s
    }
  }
}

function handleSubmit(payload: any) {
  if (!payload) return
  const from = payload.from || {}
  const data = payload.data || {}
  if (!from.groupNo || !from.studentNo) return
  
  if (String(payload.type || '') === 'question' && Array.isArray((data as any).strokes)) {
    const strokes = (data as any).strokes
    const w = Number((data as any).width) || 0
    const h = Number((data as any).height) || 0
    const g = String(from.groupNo)
    const s = String(from.studentNo)
    recordDrawing(g, s, { strokes, width: w, height: h })
  }
  
  if (String(payload.type || '') === 'survey') {
    const g = String(from.groupNo)
    const s = String(from.studentNo)
    const sk = studentKey(g, s)
    surveyDone.add(sk)
    
    const topic = String(data.topic || '')
    let activityKey: ActivityKey | '' = ''
    
    if (topic === '协作设计') {
      activityKey = 'a3'
    } else {
      const title = String(data.title || '')
      activityKey = title === '数据我看看' ? 'a1' : title === '维数据我用用' ? 'a2' : ''
    }
    
    if (activityKey !== '') {
      groupDoneSets[activityKey].add(g)
    }
  }
  
  if (String(payload.type || '') === 'activity4_photo') {
    const g = String(from.groupNo)
    groupDoneSets.a4.add(g)
  }
  
  if (String(payload.type || '') === 'activity5_vote') {
    const g = String(from.groupNo)
    groupDoneSets.a5.add(g)
  }
  
  if (String(payload.type || '') === 'activity6_upload') {
    const g = String(from.groupNo)
    groupDoneSets.a6.add(g)
  }
  
  if (String(payload.type || '') === 'activity7_design') {
    const g = String(from.groupNo)
    groupDoneSets.a7.add(g)
  }
}

function removeStudentByIds(groupNo: string, studentNo: string) {
  let g = parseInt(groupNo, 10)
  if (!Number.isFinite(g) || g < 1) g = 1
  if (g > GROUP_COUNT) g = GROUP_COUNT
  const s = String(studentNo)
  const grp = groups[g - 1]
  if (grp.left === s) grp.left = ''
  if (grp.right === s) grp.right = ''
}

function handleOnline(evt: any) {
  const pushOne = (item: any) => {
    if (!item) return
    const g = String((item as any).groupNo ?? '')
    const s = String((item as any).studentNo ?? '')
    if (g && s) placeStudent(g, s)
  }
  if (Array.isArray(evt)) {
    evt.forEach(pushOne)
  } else if (evt && typeof evt === 'object') {
    const values = Object.values(evt)
    if (values.length && typeof values[0] === 'object') {
      values.forEach(pushOne)
    } else {
      pushOne(evt)
    }
  }
}

function handleOffline(evt: any) {
  if (!evt) return
  const g = String((evt as any).groupNo ?? '')
  const s = String((evt as any).studentNo ?? '')
  if (g && s) removeStudentByIds(g, s)
}

onMounted(async () => {
  socket.on('submit', handleSubmit)
  socket.on('online', handleOnline)
  socket.on('offline', handleOffline)

  try {
    socket.request({
      mode: EntityMode.GROUP,
      messageType: 'get_stu_status',
      activityIndex: '0',
      data: null
    })
  } catch {}
})

onBeforeUnmount(() => {
  socket.off('submit', handleSubmit)
  socket.off('online', handleOnline)
  socket.off('offline', handleOffline)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 10px;
  max-width: 1280px;
  margin: 0 auto;
}

/* 顶部横幅 - 横向渐变 */
.banner {
  background: linear-gradient(90deg, #4ea3f9 0%, #6cc2ff 50%, #e9f6ff 100%);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.banner-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-badge {
  background: white;
  color: #2d6cb3;
  border-radius: 20px;
  padding: 6px 14px;
  font-weight: 700;
  font-size: 14px;
}

.title {
  font-size: 28px;
  font-weight: 800;
  color: #F5F7FA;
  margin: 0;
}

/* 活动按钮区 */
.activity-btns {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.activity-btn {
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.activity-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

.activity-btn.active {
  background: white;
  color: #1976d2;
  border-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.spacer {
  flex: 1;
}

.logout-btn {
  padding: 8px 12px !important;
  background: rgba(255, 255, 255, 0.25) !important;
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  color: #1976d2 !important;
  flex-shrink: 0;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.6) !important;
  transform: scale(1.05);
}

/* 统一内容区 */
.content-box {
  background: #F5F5F0;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .banner-inner {
    flex-wrap: wrap;
  }
  
  .activity-btns {
    order: 3;
    width: 100%;
    margin-top: 12px;
    margin-left: 0;
  }
  
  .spacer {
    display: none;
  }
}
</style>