<template>
  <div class="page">
    <!-- 顶部标题横幅（参考学生端风格） -->
    <div class="banner">
      <div class="banner-inner">
        <div class="banner-badge">第 5 课</div>
        <h1 class="title">课堂看板</h1>
      </div>
    </div>
    
    <div style="margin: 6px 0 8px; display: flex; gap: 8px;">
      <el-button 
        :type="currentActivity === 'activity1' ? 'primary' : 'default'" 
        size="large" 
        @click="goActivity1"
        :class="{ 'active-button': currentActivity === 'activity1' }"
      >
        前往活动一
        <span v-if="currentActivity === 'activity1'" class="active-indicator">✓</span>
      </el-button>
      <el-button 
        :type="currentActivity === 'activity2' ? 'primary' : 'default'" 
        size="large" 
        @click="goActivity2"
        :class="{ 'active-button': currentActivity === 'activity2' }"
      >
        前往活动二
        <span v-if="currentActivity === 'activity2'" class="active-indicator">✓</span>
      </el-button>
      <el-button 
        :type="currentActivity === 'activity3' ? 'primary' : 'default'" 
        size="large" 
        @click="goActivity3"
        :class="{ 'active-button': currentActivity === 'activity3' }"
      >
        前往活动三
        <span v-if="currentActivity === 'activity3'" class="active-indicator">✓</span>
      </el-button>
      <el-button 
        :type="currentActivity === 'activity4' ? 'primary' : 'default'" 
        size="large" 
        @click="goActivity4"
        :class="{ 'active-button': currentActivity === 'activity4' }"
      >
        前往活动四
        <span v-if="currentActivity === 'activity4'" class="active-indicator">✓</span>
      </el-button>
    </div>

    <div class="layout">
      <div class="main">
        <div class="groups">
          <div
            v-for="g in 25"
            :key="g"
            class="group-card"
          >
            <div class="group-head">第{{ g }}组</div>
            <div class="group-body">
              <div class="student-slot">
                <span class="dot" :class="{ on: !!groups[g-1].left, survey: !!groups[g-1].left && isSurveyed(String(g), groups[g-1].left) }"></span>
                <span class="stu-no">{{ groups[g-1].left || '空' }}</span>
                <span v-if="groups[g-1].left && drawCount(String(g), groups[g-1].left) > 0" class="badge">{{ drawCount(String(g), groups[g-1].left) }}</span>
              </div>
              <span class="v-sep"></span>
              <div class="student-slot">
                <span class="dot" :class="{ on: !!groups[g-1].right, survey: !!groups[g-1].right && isSurveyed(String(g), groups[g-1].right) }"></span>
                <span class="stu-no">{{ groups[g-1].right || '空' }}</span>
                <span v-if="groups[g-1].right && drawCount(String(g), groups[g-1].right) > 0" class="badge">{{ drawCount(String(g), groups[g-1].right) }}</span>
              </div>
            </div>
          </div>
        </div>
        <aside class="aside">
          <div style="display: none;" class="overview-card">
            <div class="ov-title">总览</div>
            <div class="ov-grid">
              <!-- 左：已登录 -->
              <div class="ov-col">
                <div class="ov-item">
                  <span class="ov-label">已登录（按组）</span>
                  <span class="ov-value">{{ loggedInCount }} / 25</span>
                </div>
                <div class="ov-progress">
                  <div class="bar">
                    <div class="bar-inner" :style="{ width: percent + '%' }"></div>
                  </div>
                  <div class="ov-percent">{{ percent }}%</div>
                </div>
              </div>

              <!-- 右：活动完成（更宽，横向排列） -->
              <div class="ov-col activities">
                <div class="ov-act" v-for="act in activitiesView" :key="act.key" :class="{ active: act.active }">
                  <div class="ov-item">
                    <span class="ov-label">{{ act.title }}</span>
                    <span class="ov-value">{{ activityCount[act.key] }} / 25</span>
                  </div>
                  <div class="ov-progress">
                    <div class="bar blue">
                      <div class="bar-inner" :style="{ width: activityPercent[act.key] + '%' }"></div>
                    </div>
                    <div class="ov-percent">{{ activityPercent[act.key] }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <!-- 子路由渲染区（如：/teacher/question1 显示提交查看） -->
        <router-view style="width: 1024px;" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { socketService } from '@/services/socket'
import { ElMessage } from 'element-plus'

// 25个小组，每组2个位置：left/right；值为学号字符串，空为 ''
const GROUP_COUNT = 25
const groups = reactive(Array.from({ length: GROUP_COUNT }, () => ({ left: '', right: '' })))

// 活动定义与完成集（以 学生唯一键 group-student 记录）
type ActivityKey = 'a1' | 'a2' | 'a3' | 'a4'
const activities: Array<{ key: ActivityKey; title: string }> = [
  { key: 'a1', title: '活动一：数据获取方法多' },
  { key: 'a2', title: '活动二：问卷调查巧设计' },
  { key: 'a3', title: '活动三：协作问卷设计' },
  { key: 'a4', title: '活动四：摄像头拍照活动' }
]

// 调查问卷完成集（以 学生唯一键 group-student 记录）
const surveyDone = reactive(new Set<string>())
function isSurveyed(groupNo: string, studentNo: string): boolean {
  const sk = studentKey(String(groupNo), String(studentNo))
  return surveyDone.has(sk)
}

// 组完成集（按组统计是否有任一学生完成）
const groupDoneSets = reactive<Record<ActivityKey, Set<string>>>(
  {
    a1: new Set<string>(),
    a2: new Set<string>(),
    a3: new Set<string>(),
    a4: new Set<string>()
  }
)
const studentKey = (groupNo: string, studentNo: string) => `${groupNo}-${studentNo}`

// 学生圈画数据存储：key=group-student，仅保留最新一次提交
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
function drawCount(groupNo: string, studentNo: string): number {
  const key = studentKey(groupNo, studentNo)
  return drawStore.has(key) ? 1 : 0
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
  // 圈画题：业务子类型通过 payload.type 指示为 'question'
  if (String(payload.type || '') === 'question' && Array.isArray((data as any).strokes)) {
    const strokes = (data as any).strokes
    const w = Number((data as any).width) || 0
    const h = Number((data as any).height) || 0
    const g = String(from.groupNo)
    const s = String(from.studentNo)
    recordDrawing(g, s, { strokes, width: w, height: h })
  }
  // 问卷提交：总览统计与看板点亮红色
  if (String(payload.type || '') === 'survey') {
    const g = String(from.groupNo)
    const s = String(from.studentNo)
    const sk = studentKey(g, s)
    surveyDone.add(sk)
    
    // 记录活动完成：根据 data.topic 判定（Activity3使用topic字段区分）
    const topic = String(data.topic || '')
    let activityKey: ActivityKey | '' = ''
    
    if (topic === '协作设计') {
      activityKey = 'a3'
    } else {
      // 原有的title判定逻辑保持不变
      const title = String(data.title || '')
      activityKey = title === '数据我看看' ? 'a1' : title === '维数据我用用' ? 'a2' : ''
    }
    
    if (activityKey !== '') {
      groupDoneSets[activityKey].add(g)
    }
  }
  
  // 拍照提交：Activity4完成统计
  if (String(payload.type || '') === 'activity4_photo') {
    const g = String(from.groupNo)
    groupDoneSets.a4.add(g)
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
  // evt 可能是单条 { studentNo, groupNo }，也可能是列表或对象映射
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
  // 监听新协议事件
  socketService.on('submit', handleSubmit)
  socketService.on('online', handleOnline)
  socketService.on('offline', handleOffline)

  // 首次获取在线学生快照
  try {
    await socketService.request({ type: 'get_stu_status', data: {}, at: Date.now() } as any)
    // 服务端会点对点回推一个 'online' 列表，我们在 handleOnline 中统一处理
  } catch {}
})

onBeforeUnmount(() => {
  socketService.off('submit', handleSubmit)
  socketService.off('online', handleOnline)
  socketService.off('offline', handleOffline)
})

// 统计：已登录组数与百分比（组内任意一人在线即计入）
const loggedInCount = computed(() =>
  groups.reduce((acc, g) => acc + ((g.left || g.right) ? 1 : 0), 0)
)
const percent = computed(() => Math.round((loggedInCount.value / GROUP_COUNT) * 100))

// 活动完成统计与百分比（按组）
const activityCount = computed<Record<ActivityKey, number>>(() => ({
  a1: groupDoneSets.a1.size,
  a2: groupDoneSets.a2.size,
  a3: groupDoneSets.a3.size,
  a4: groupDoneSets.a4.size
}))
const activityPercent = computed<Record<ActivityKey, number>>(() => ({
  a1: Math.round((groupDoneSets.a1.size / GROUP_COUNT) * 100),
  a2: Math.round((groupDoneSets.a2.size / GROUP_COUNT) * 100),
  a3: Math.round((groupDoneSets.a3.size / GROUP_COUNT) * 100),
  a4: Math.round((groupDoneSets.a4.size / GROUP_COUNT) * 100)
}))

// 问卷完成百分比（保留字段，若后续需要展示，可改为按组）
// const surveyedPercent = computed(() => Math.round((surveyDone.size / (GROUP_COUNT * 2)) * 100))

// 根据路由高亮/排序活动
const route = useRoute()
const currentActKey = computed<ActivityKey | ''>(() => {
  const p = String(route.path || '')
  if (p.includes('activity1')) return 'a1'
  if (p.includes('activity2')) return 'a2'
  if (p.includes('activity3')) return 'a3'
  if (p.includes('activity4')) return 'a4'
  return ''
})
const activitiesView = computed(() => {
  const cur = currentActKey.value
  const enhanced = activities.map(a => ({ ...a, active: a.key === cur })) as Array<{ key: ActivityKey; title: string; active: boolean }>
  if (!cur) return enhanced
  // 当前活动置顶，其余保持原有顺序
  return enhanced.sort((x, y) => Number(y.active) - Number(x.active))
})

// 记录当前活跃的活动
const currentActivity = ref<string>('')

// 教师端点击"前往活动一"：广播分发并自跳转
const router = useRouter()
async function goActivity1() {
  try {
    const payload: any = {
      type: 'navigate',
      from: { role: 'teacher' },
      to: ['0'], // 广播到全体
      data: { target: 'student', route: 'activity1' },
      at: Date.now()
    }
    await socketService.distribute(payload)
    currentActivity.value = 'activity1'
    ElMessage.success('已通知所有学生前往活动一')
  } catch (error) {
    console.error('发送导航消息失败:', error)
    ElMessage.warning('发送通知失败，但教师端已跳转')
  }
  router.push('/teacher/activity1')
}

// 教师端点击"前往活动二"：广播分发并自跳转
async function goActivity2() {
  try {
    const payload: any = {
      type: 'navigate',
      from: { role: 'teacher' },
      to: ['0'], // 广播到全体
      data: { target: 'student', route: 'activity2' },
      at: Date.now()
    }
    await socketService.distribute(payload)
    currentActivity.value = 'activity2'
    ElMessage.success('已通知所有学生前往活动二')
  } catch (error) {
    console.error('发送导航消息失败:', error)
    ElMessage.warning('发送通知失败，但教师端已跳转')
  }
  router.push('/teacher/activity2')
}

// 教师端点击"前往活动三"：广播分发并自跳转
async function goActivity3() {
  try {
    const payload: any = {
      type: 'navigate',
      from: { role: 'teacher' },
      to: ['0'], // 广播到全体
      data: { target: 'student', route: 'activity3' },
      at: Date.now()
    }
    await socketService.distribute(payload)
    currentActivity.value = 'activity3'
    ElMessage.success('已通知所有学生前往活动三')
  } catch (error) {
    console.error('发送导航消息失败:', error)
    ElMessage.warning('发送通知失败，但教师端已跳转')
  }
  router.push('/teacher/activity3')
}

// 教师端点击"前往活动四"：广播分发并自跳转
async function goActivity4() {
  try {
    const payload: any = {
      type: 'navigate',
      from: { role: 'teacher' },
      to: ['0'], // 广播到全体
      data: { target: 'student', route: 'activity4' },
      at: Date.now()
    }
    await socketService.distribute(payload)
    currentActivity.value = 'activity4'
    ElMessage.success('已通知所有学生前往活动四')
  } catch (error) {
    console.error('发送导航消息失败:', error)
    ElMessage.warning('发送通知失败，但教师端已跳转')
  }
  router.push('/teacher/activity4')
}
</script>

<style scoped>
.page {
  max-width: 1280px; /* 扩展整体页面宽度 */
  margin: 0 auto;
  padding: 8px 6px;
}

/* 横幅样式（参考学生端） */
.banner {
  background: linear-gradient(180deg, #4ea3f9 0%, #6cc2ff 60%, #e9f6ff 100%);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  margin-bottom: 16px;
  color: #0b3a6d;
}
.banner-inner { 
  display: flex; 
  align-items: center; 
  gap: 14px; 
}
.banner-badge {
  background: #fff;
  color: #2d6cb3;
  border-radius: 999px;
  padding: 6px 12px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 1px;
  margin: 0;
  color: #F5F7FA;
}
.layout {
  display: grid;
  grid-template-columns: 1fr; /* 侧栏已移至主列下方 */
  gap: 8px;
}
.main { min-width: 0; }
.groups {
  display: none;
  grid-template-columns: repeat(13, 1fr); /* 每行13组 */
  gap: 6px; /* 更紧凑 */
  
}
.group-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 6px 8px;
  background: #fff;
}
.group-head {
  font-size: 10px;
  color: #666;
  margin-bottom: 4px;
}
.group-body {
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* 左学生 | 竖线 | 右学生 */
  align-items: center;
  gap: 6px;
}
.student-slot {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: transparent;
}
.dot.on {
  background: #67c23a;
  border-color: #67c23a;
}
/* 问卷已提交：红色优先级更高 */
.dot.survey {
  background: #f56c6c;
  border-color: #f56c6c;
}
.stu-no {
  font-size: 11px;
  color: #333;
  line-height: 1;
}
.v-sep {
  width: 1px;
  height: 14px;
  background: #e5e7eb;
  display: inline-block;
}

/* 总览卡片（已移至 groups 下方） */
.aside { min-width: 0; margin-top: 8px; }
.overview-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
}
.ov-grid {
  display: grid;
  grid-template-columns: 1fr 2fr; /* 左窄右宽 */
  gap: 12px;
  align-items: start;
}
.ov-col { min-width: 0; }
/* 活动完成横向排列 */
.ov-col.activities {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.ov-col.activities .ov-act {
  flex: 1 1 240px; /* 最小宽度240，可自适应换行 */
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  background: #fff;
}
@media (max-width: 900px) {
  .ov-grid { grid-template-columns: 1fr; }
}
.overview-card + .overview-card { margin-top: 8px; }
.ov-title {
  font-size: 12px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}
.ov-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  margin-bottom: 8px;
}
.ov-label { color: #666; }
.ov-value { color: #111; font-weight: 700; }
.ov-progress { display: flex; align-items: center; gap: 8px; }
.bar {
  position: relative;
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}
.bar-inner {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #67c23a;
  border-radius: 999px;
}
.ov-percent { font-size: 12px; color: #333; width: 40px; text-align: right; }

/* 红色进度条（问卷完成率） */
.bar.red { background: #fde2e2; }
.bar.red .bar-inner { background: #f56c6c; }
.ov-act.active { border-left: 3px solid #409eff; padding-left: 6px; }
.ov-act.active .ov-label { font-weight: 700; color: #111; }
.bar.blue { background: #e0f2fe; }
.bar.blue .bar-inner { background: #409eff; }

/* 提交查看缩略图样式 */
.review { margin-top: 10px; }
.review-title { font-size: 12px; font-weight: 700; color: #333; margin: 6px 0; }
.thumb-list { display: flex; flex-wrap: wrap; gap: 8px; }
.thumb-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px; background: #fff; }
.thumb-wrap { position: relative; display: inline-block; }
.thumb-img { display: block; }
.thumb-canvas { position: absolute; left: 0; top: 0; }
.thumb-meta { font-size: 11px; color: #666; margin-top: 4px; }

/* 活跃按钮样式 */
.active-button {
  position: relative;
}
.active-indicator {
  margin-left: 6px;
  font-size: 12px;
  color: #fff;
  font-weight: bold;
}
.active-button .active-indicator {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
</style>
