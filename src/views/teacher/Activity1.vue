<template>
  <div class="page">
    <!-- 结果展示区域 -->
    <div class="stats-section">
      <!-- 活动标题 -->
      <div class="activity-header">
        <h2 class="activity-title">📝 观点交锋，方法初探</h2>
      </div>

      <!-- 观点对抗区域 -->
      <div class="battle-container">
        <div 
          class="battle-arena" 
          :style="battleGridStyle"
        >
          <!-- 正方卡片容器 -->
          <div class="opinion-side side-a">
            <div class="side-header">
              <h3 class="side-title">A 利大于弊</h3>
              <div class="side-badge">{{ countA }}组</div>
            </div>
            
            <!-- 提炼卡片 - 只在提炼模式显示 -->
            <div v-if="isSummaryMode" class="summary-card card-a">
              <!-- 加载中显示脉冲动画 -->
              <div v-if="isLoadingSummaryA" class="loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
              <!-- 数据加载完成后显示打字机效果 -->
              <div v-else class="summary-content">
                <span class="summary-text">{{ typedSummaryA }}</span>
              </div>
            </div>
            
            <div class="cards-wrapper" :class="{ 'refine-mode': isSummaryMode, 'organize-mode': isOrganizeMode, 'organize-stage-1': organizeAnimationStage === 1 }">
              <!-- 整理模式：显示 Coze 分析结果 -->
              <template v-if="isOrganizeMode">
                <!-- 阶段1: 只显示所有 items，不带卡片框 -->
                <template v-if="organizeAnimationStage === 1">
                  <div 
                    v-for="(item, index) in [...cozeResultA.p1, ...cozeResultA.p2, ...cozeResultA.p3, ...cozeResultA.p4]" 
                    :key="'a-item-' + index"
                    class="coze-item-floating card-a"
                    :style="{ animationDelay: `${index * 80}ms` }"
                  >
                    {{ item }}
                  </div>
                </template>
                
                <!-- 阶段2-3: 显示卡片框和标题 -->
                <template v-else>
                  <!-- P1: 使用时长 -->
                  <div v-if="cozeResultA.p1.length > 0" class="coze-card card-a" :class="{ 'show-box': organizeAnimationStage >= 2, 'show-header': organizeAnimationStage >= 3 }">
                    <div class="coze-card-header" :class="{ 'header-pulse': organizeAnimationStage === 3 }">
                      <span class="coze-icon">⏱️</span>
                      <span class="coze-title">{{ typingTitles.a1 }}</span>
                    </div>
                    <div class="coze-card-content">
                      <div v-for="(item, index) in cozeResultA.p1" :key="'a-p1-' + index" class="coze-item">
                        {{ item }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- P2: 使用影响 -->
                  <div v-if="cozeResultA.p2.length > 0" class="coze-card card-a" :class="{ 'show-box': organizeAnimationStage >= 2, 'show-header': organizeAnimationStage >= 3 }">
                    <div class="coze-card-header" :class="{ 'header-pulse': organizeAnimationStage === 3 }">
                      <span class="coze-icon">💡</span>
                      <span class="coze-title">{{ typingTitles.a2 }}</span>
                    </div>
                    <div class="coze-card-content">
                      <div v-for="(item, index) in cozeResultA.p2" :key="'a-p2-' + index" class="coze-item">
                        {{ item }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- P3: 使用用途 -->
                  <div v-if="cozeResultA.p3.length > 0" class="coze-card card-a" :class="{ 'show-box': organizeAnimationStage >= 2, 'show-header': organizeAnimationStage >= 3 }">
                    <div class="coze-card-header" :class="{ 'header-pulse': organizeAnimationStage === 3 }">
                      <span class="coze-icon">🎯</span>
                      <span class="coze-title">{{ typingTitles.a3 }}</span>
                    </div>
                    <div class="coze-card-content">
                      <div v-for="(item, index) in cozeResultA.p3" :key="'a-p3-' + index" class="coze-item">
                        {{ item }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- P4: 使用安全 -->
                  <div v-if="cozeResultA.p4.length > 0" class="coze-card card-a" :class="{ 'show-box': organizeAnimationStage >= 2, 'show-header': organizeAnimationStage >= 3 }">
                    <div class="coze-card-header" :class="{ 'header-pulse': organizeAnimationStage === 3 }">
                      <span class="coze-icon">🔒</span>
                      <span class="coze-title">{{ typingTitles.a4 }}</span>
                    </div>
                    <div class="coze-card-content">
                      <div v-for="(item, index) in cozeResultA.p4" :key="'a-p4-' + index" class="coze-item">
                        {{ item }}
                      </div>
                    </div>
                  </div>
                </template>
              </template>
              
              <!-- 提炼模式：只显示 reason -->
              <template v-else-if="isSummaryMode">
                <div 
                  v-for="(reason, index) in activity.ac1_allReason.A" 
                  :key="'reason-a-' + index"
                  class="reason-item reason-a"
                >
                  {{ reason }}
                </div>
              </template>
              
              <!-- 普通模式：显示完整卡片 -->
              <template v-else>
                <template v-if="viewpointA.length > 0">
                  <div 
                    v-for="item in viewpointA" 
                    :key="item.id"
                    class="opinion-card card-a"
                  >
                    <div class="card-group">{{ item.groupNo }}组</div>
                    <div class="card-reasons">
                      <div v-if="item.result.point[1]" class="reason">{{ item.result.point[1] }}</div>
                      <div v-if="item.result.point[2]" class="reason">{{ item.result.point[2] }}</div>
                    </div>
                  </div>
                </template>
                <div v-else class="empty-state">暂无提交</div>
              </template>
            </div>
          </div>

          <!-- VS 分隔符 -->
          <div class="vs-divider" :class="{ 'vs-centered': isOrganizeMode || isSummaryMode }">
            <div class="vs-badge-container" @click="handleNextStep">
              <div class="vs-badge-flip">
                <div class="vs-badge-front">VS</div>
                <div class="vs-badge-back">
                  <span v-if="currentStep === 0">提炼</span>
                  <span v-else>整理</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 反方卡片容器 -->
          <div class="opinion-side side-b">
            <div class="side-header">
              <h3 class="side-title">B 弊大于利</h3>
              <div class="side-badge">{{ countB }}组</div>
            </div>
            
            <!-- 提炼卡片 - 只在提炼模式显示 -->
            <div v-if="isSummaryMode" class="summary-card card-b">
              <!-- 加载中显示脉冲动画 -->
              <div v-if="isLoadingSummaryB" class="loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
              <!-- 数据加载完成后显示打字机效果 -->
              <div v-else class="summary-content">
                <span class="summary-text">{{ typedSummaryB }}</span>
              </div>
            </div>
            
            <div class="cards-wrapper" :class="{ 'refine-mode': isSummaryMode, 'organize-mode': isOrganizeMode, 'organize-stage-1': organizeAnimationStage === 1 }">
              <!-- 整理模式：显示 Coze 分析结果 -->
              <template v-if="isOrganizeMode">
                <!-- 阶段1: 只显示所有 items，不带卡片框 -->
                <template v-if="organizeAnimationStage === 1">
                  <div 
                    v-for="(item, index) in [...cozeResultB.p1, ...cozeResultB.p2, ...cozeResultB.p3, ...cozeResultB.p4]" 
                    :key="'b-item-' + index"
                    class="coze-item-floating card-b"
                    :style="{ animationDelay: `${(index + Object.values(cozeResultA).reduce((sum, arr) => sum + arr.length, 0)) * 80}ms` }"
                  >
                    {{ item }}
                  </div>
                </template>
                
                <!-- 阶段2-3: 显示卡片框和标题 -->
                <template v-else>
                  <!-- P1: 使用时长 -->
                  <div v-if="cozeResultB.p1.length > 0" class="coze-card card-b" :class="{ 'show-box': organizeAnimationStage >= 2, 'show-header': organizeAnimationStage >= 3 }">
                    <div class="coze-card-header" :class="{ 'header-pulse': organizeAnimationStage === 3 }">
                      <span class="coze-icon">⏱️</span>
                      <span class="coze-title">{{ typingTitles.b1 }}</span>
                    </div>
                    <div class="coze-card-content">
                      <div v-for="(item, index) in cozeResultB.p1" :key="'b-p1-' + index" class="coze-item">
                        {{ item }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- P2: 使用影响 -->
                  <div v-if="cozeResultB.p2.length > 0" class="coze-card card-b" :class="{ 'show-box': organizeAnimationStage >= 2, 'show-header': organizeAnimationStage >= 3 }">
                    <div class="coze-card-header" :class="{ 'header-pulse': organizeAnimationStage === 3 }">
                      <span class="coze-icon">💡</span>
                      <span class="coze-title">{{ typingTitles.b2 }}</span>
                    </div>
                    <div class="coze-card-content">
                      <div v-for="(item, index) in cozeResultB.p2" :key="'b-p2-' + index" class="coze-item">
                        {{ item }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- P3: 使用用途 -->
                  <div v-if="cozeResultB.p3.length > 0" class="coze-card card-b" :class="{ 'show-box': organizeAnimationStage >= 2, 'show-header': organizeAnimationStage >= 3 }">
                    <div class="coze-card-header" :class="{ 'header-pulse': organizeAnimationStage === 3 }">
                      <span class="coze-icon">🎯</span>
                      <span class="coze-title">{{ typingTitles.b3 }}</span>
                    </div>
                    <div class="coze-card-content">
                      <div v-for="(item, index) in cozeResultB.p3" :key="'b-p3-' + index" class="coze-item">
                        {{ item }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- P4: 使用安全 -->
                  <div v-if="cozeResultB.p4.length > 0" class="coze-card card-b" :class="{ 'show-box': organizeAnimationStage >= 2, 'show-header': organizeAnimationStage >= 3 }">
                    <div class="coze-card-header" :class="{ 'header-pulse': organizeAnimationStage === 3 }">
                      <span class="coze-icon">🔒</span>
                      <span class="coze-title">{{ typingTitles.b4 }}</span>
                    </div>
                    <div class="coze-card-content">
                      <div v-for="(item, index) in cozeResultB.p4" :key="'b-p4-' + index" class="coze-item">
                        {{ item }}
                      </div>
                    </div>
                  </div>
                </template>
              </template>
              
              <!-- 提炼模式：只显示 reason -->
              <template v-else-if="isSummaryMode">
                <div 
                  v-for="(reason, index) in activity.ac1_allReason.B" 
                  :key="'reason-b-' + index"
                  class="reason-item reason-b"
                >
                  {{ reason }}
                </div>
              </template>
              
              <!-- 普通模式：显示完整卡片 -->
              <template v-else>
                <template v-if="viewpointB.length > 0">
                  <div 
                    v-for="item in viewpointB" 
                    :key="item.id"
                    class="opinion-card card-b"
                  >
                    <div class="card-group">{{ item.groupNo }}组</div>
                    <div class="card-reasons">
                      <div v-if="item.result.point[1]" class="reason">{{ item.result.point[1] }}</div>
                      <div v-if="item.result.point[2]" class="reason">{{ item.result.point[2] }}</div>
                    </div>
                  </div>
                </template>
                <div v-else class="empty-state">暂无提交</div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
// import { ElMessage } from 'element-plus'
import { useActivity, type Activity1Result } from '@/store/activity'
import { useCoze, WORKFLOW, type ViewpointWorkflow } from '@/utils/coze'

const activity = useActivity()
const { runWorkflow } = useCoze()

// 处理提交数据，按观点分类
interface SubmissionItem {
  id: string
  groupNo: string
  result: Activity1Result
}

const viewpointA = computed(() => {
  const items: SubmissionItem[] = []
  for (const [groupNo, result] of Object.entries(activity.ac1_allResult)) {
    if (result.viewpoint === 'A') {
      items.push({ 
        id: groupNo, 
        groupNo, 
        result 
      })
    }
  }
  return items.sort((a, b) => parseInt(a.groupNo) - parseInt(b.groupNo))
})

const viewpointB = computed(() => {
  const items: SubmissionItem[] = []
  for (const [groupNo, result] of Object.entries(activity.ac1_allResult)) {
    if (result.viewpoint === 'B') {
      items.push({ 
        id: groupNo, 
        groupNo, 
        result 
      })
    }
  }
  return items.sort((a, b) => parseInt(a.groupNo) - parseInt(b.groupNo))
})

// 统计A和B的数量
const countA = computed(() => viewpointA.value.length)
const countB = computed(() => viewpointB.value.length)
const totalCount = computed(() => countA.value + countB.value)

// 动态宽度比例
const battleGridStyle = computed(() => {
  // 提炼模式或整理模式下使用 1:1 比例
  if (isSummaryMode.value || isOrganizeMode.value) {
    return { gridTemplateColumns: '1fr 100px 1fr' }
  }
  
  if (totalCount.value === 0) {
    return { gridTemplateColumns: '1fr 100px 1fr' }
  }
  
  const ratioA = Math.max(countA.value / totalCount.value, 0.3)
  const ratioB = Math.max(countB.value / totalCount.value, 0.3)
  const total = ratioA + ratioB
  
  return {
    gridTemplateColumns: `${ratioA / total}fr 100px ${ratioB / total}fr`
  }
})

// 步骤控制：0=初始, 1=提炼完成（显示整理按钮）
const currentStep = ref(0)

// 提炼模式
const isSummaryMode = ref(false)
const isRefineAnimating = ref(false) // 提炼动画进行中

// 整理模式
const isOrganizeMode = ref(false)
// 整理动画阶段：0=未开始, 1=显示items, 2=显示卡片框, 3=显示标题
const organizeAnimationStage = ref(0)

// 提炼卡片数据 - 只存储第一条信息
const summaryCardA = ref<string>('')
const summaryCardB = ref<string>('')

// 打字机效果的显示文本
const typedSummaryA = ref<string>('')
const typedSummaryB = ref<string>('')

// 是否正在加载提炼数据
const isLoadingSummaryA = ref(false)
const isLoadingSummaryB = ref(false)

// Coze AI 分析结果
const cozeResultA = ref({
  p1: [] as string[],
  p2: [] as string[],
  p3: [] as string[],
  p4: [] as string[]
})

const cozeResultB = ref({
  p1: [] as string[],
  p2: [] as string[],
  p3: [] as string[],
  p4: [] as string[]
})

// 标题打字机效果
const typingTitles = ref({
  a1: '',
  a2: '',
  a3: '',
  a4: '',
  b1: '',
  b2: '',
  b3: '',
  b4: ''
})

const titleNames = {
  a1: '使用时长',
  a2: '使用影响',
  a3: '使用用途',
  a4: '使用安全',
  b1: '使用时长',
  b2: '使用影响',
  b3: '使用用途',
  b4: '使用安全'
}

// 提炼卡片打字机效果
const typeSummaryText = async (text: string, target: 'A' | 'B') => {
  const typedRef = target === 'A' ? typedSummaryA : typedSummaryB
  
  // 重置
  typedRef.value = ''
  
  // 逐字打印文本
  for (let i = 0; i <= text.length; i++) {
    typedRef.value = text.substring(0, i)
    await new Promise(resolve => setTimeout(resolve, 50)) // 每个字30ms
  }
}

// 标题打字机效果函数
const typeTitle = async (key: 'a1' | 'a2' | 'a3' | 'a4' | 'b1' | 'b2' | 'b3' | 'b4', text: string, delay: number = 0) => {
  // 延迟开始
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  typingTitles.value[key] = ''
  for (let i = 0; i <= text.length; i++) {
    typingTitles.value[key] = text.substring(0, i)
    await new Promise(resolve => setTimeout(resolve, 150))
  }
}

// 启动所有标题的打字机效果
const startTitleTyping = async () => {
  const tasks: Promise<void>[] = []
  let delayAccumulator = 0
  
  // 正方
  if (cozeResultA.value.p1.length > 0) {
    tasks.push(typeTitle('a1', titleNames.a1, delayAccumulator))
    delayAccumulator += titleNames.a1.length * 150
  }
  if (cozeResultA.value.p2.length > 0) {
    tasks.push(typeTitle('a2', titleNames.a2, delayAccumulator))
    delayAccumulator += titleNames.a2.length * 150
  }
  if (cozeResultA.value.p3.length > 0) {
    tasks.push(typeTitle('a3', titleNames.a3, delayAccumulator))
    delayAccumulator += titleNames.a3.length * 150
  }
  if (cozeResultA.value.p4.length > 0) {
    tasks.push(typeTitle('a4', titleNames.a4, delayAccumulator))
    delayAccumulator += titleNames.a4.length * 150
  }
  
  // 反方
  if (cozeResultB.value.p1.length > 0) {
    tasks.push(typeTitle('b1', titleNames.b1, delayAccumulator))
    delayAccumulator += titleNames.b1.length * 150
  }
  if (cozeResultB.value.p2.length > 0) {
    tasks.push(typeTitle('b2', titleNames.b2, delayAccumulator))
    delayAccumulator += titleNames.b2.length * 150
  }
  if (cozeResultB.value.p3.length > 0) {
    tasks.push(typeTitle('b3', titleNames.b3, delayAccumulator))
    delayAccumulator += titleNames.b3.length * 150
  }
  if (cozeResultB.value.p4.length > 0) {
    tasks.push(typeTitle('b4', titleNames.b4, delayAccumulator))
  }
  
  await Promise.all(tasks)
}

// 统一的步骤处理函数
const handleNextStep = async () => {
  if (currentStep.value === 0) {
    // 第一步：提炼
    await handleSummary()
    currentStep.value = 1
  } else if (currentStep.value === 1) {
    // 第二步：整理
    await handleOrganize()
  }
}

const handleSummary = async () => {
  try {
    console.log('[提炼] 开始提炼流程')
    
    // 1. 提取所有观点数据
    extractAllReasons()
    
    console.log('[提炼] 提取的观点数据 A:', activity.ac1_allReason.A)
    console.log('[提炼] 提取的观点数据 B:', activity.ac1_allReason.B)
    
    // 2. 立即进入提炼模式，显示加载中的卡片
    isSummaryMode.value = true
    isLoadingSummaryA.value = true
    isLoadingSummaryB.value = true
    
    // 3. 播放拆分动画
    isRefineAnimating.value = true
    await playRefineAnimation()
    isRefineAnimating.value = false
    
    // 4. 调用 Coze AI 获取提炼卡片内容（后台进行）
    // ElMessage.info('正在生成提炼卡片...')
    
    const viewpointA = activity.ac1_allReason.A
    const viewpointB = activity.ac1_allReason.B
    
    // 并行调用工作流，index 为 1
    const [rawSummaryA, rawSummaryB] = await Promise.all([
      runWorkflow(WORKFLOW.GET_VIEWPOINT, { index: 1, input: viewpointA } as ViewpointWorkflow),
      runWorkflow(WORKFLOW.GET_VIEWPOINT, { index: 1, input: viewpointB } as ViewpointWorkflow)
    ])
    
    console.log('[提炼卡片] 原始返回 A:', rawSummaryA)
    console.log('[提炼卡片] 原始返回 B:', rawSummaryB)
    
    // 将返回结果转化为 JSON
    const summaryA = rawSummaryA ? JSON.parse(rawSummaryA) : null
    const summaryB = rawSummaryB ? JSON.parse(rawSummaryB) : null
    
    console.log('[提炼卡片] 解析后 A:', summaryA)
    console.log('[提炼卡片] 解析后 B:', summaryB)
    
    // 5. 提取 option 中的 o1（只需要第一条）
    if (summaryA?.option?.o1) {
      summaryCardA.value = summaryA.option.o1
      console.log('[提炼卡片] 提取的 A:', summaryCardA.value)
      
      // 停止加载，开始打字机效果
      isLoadingSummaryA.value = false
      typeSummaryText(summaryCardA.value, 'A')
    }
    
    if (summaryB?.option?.o1) {
      summaryCardB.value = summaryB.option.o1
      console.log('[提炼卡片] 提取的 B:', summaryCardB.value)
      
      // 停止加载，开始打字机效果
      isLoadingSummaryB.value = false
      typeSummaryText(summaryCardB.value, 'B')
    }
    
    console.log('[提炼] 进入提炼模式，isSummaryMode =', isSummaryMode.value)
    
    // ElMessage.success('观点提炼完成')
  } catch (error) {
    console.error('[提炼] 调用失败:', error)
    isRefineAnimating.value = false
    isLoadingSummaryA.value = false
    isLoadingSummaryB.value = false
    // ElMessage.error('提炼失败，请重试')
  }
}

// 提取所有观点数据
const extractAllReasons = () => {
  const reasonsA: string[] = []
  const reasonsB: string[] = []
  
  for (const [, result] of Object.entries(activity.ac1_allResult)) {
    if (result.viewpoint === 'A') {
      if (result.point[1]) reasonsA.push(result.point[1])
      if (result.point[2]) reasonsA.push(result.point[2])
    } else if (result.viewpoint === 'B') {
      if (result.point[1]) reasonsB.push(result.point[1])
      if (result.point[2]) reasonsB.push(result.point[2])
    }
  }
  
  activity.ac1_allReason.A = reasonsA
  activity.ac1_allReason.B = reasonsB
}

// 提炼动画 - 拆分卡片，重组 reason
const playRefineAnimation = async () => {
  const opinionCards = document.querySelectorAll('.opinion-card')
  if (opinionCards.length === 0) return
  
  const animations: Promise<void>[] = []
  
  opinionCards.forEach((card, index) => {
    const reasons = card.querySelectorAll('.reason')
    
    reasons.forEach((reason, reasonIndex) => {
      const reasonRect = reason.getBoundingClientRect()
      
      // 创建克隆
      const clone = reason.cloneNode(true) as HTMLElement
      clone.style.position = 'fixed'
      clone.style.left = `${reasonRect.left}px`
      clone.style.top = `${reasonRect.top}px`
      clone.style.width = `${reasonRect.width}px`
      clone.style.height = `${reasonRect.height}px`
      clone.style.margin = '0'
      clone.style.zIndex = '9999'
      clone.style.pointerEvents = 'none'
      clone.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
      
      document.body.appendChild(clone)
      
      const animationPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          // 添加脉冲效果
          clone.style.transform = 'scale(1.1)'
          
          setTimeout(() => {
            clone.style.transform = 'scale(1)'
            clone.style.opacity = '0.5'
            
            setTimeout(() => {
              clone.remove()
              resolve()
            }, 600)
          }, 200)
        }, (index * reasons.length + reasonIndex) * 80)
      })
      
      animations.push(animationPromise)
    })
  })
  
  await Promise.all(animations)
}

const handleOrganize = async () => {
  try {
    // 调用 Coze AI 分析观点
    // ElMessage.info('正在分析观点...')
    
    // 获取正反方观点数组
    const viewpointA = activity.ac1_allReason.A
    const viewpointB = activity.ac1_allReason.B
    
    // 分别调用 GET_VIEWPOINT 工作流
    const [rawResultA, rawResultB] = await Promise.all([
      runWorkflow(WORKFLOW.GET_VIEWPOINT, { index: 2, input: viewpointA } as ViewpointWorkflow),
      runWorkflow(WORKFLOW.GET_VIEWPOINT, { index: 2, input: viewpointB } as ViewpointWorkflow)
    ])
    
    console.log('[整理] 原始返回 A:', rawResultA)
    console.log('[整理] 原始返回 B:', rawResultB)
    
    // 将返回结果转化为 JSON
    const resultA = rawResultA ? JSON.parse(rawResultA) : null
    const resultB = rawResultB ? JSON.parse(rawResultB) : null
    
    console.log('[整理] 解析后 A:', resultA)
    console.log('[整理] 解析后 B:', resultB)
    
    // 保存 Coze 结果
    if (resultA?.output) {
      cozeResultA.value = {
        p1: resultA.output.p1 || [],
        p2: resultA.output.p2 || [],
        p3: resultA.output.p3 || [],
        p4: resultA.output.p4 || []
      }
      console.log('[整理] 保存的 cozeResultA:', cozeResultA.value)
    }
    
    if (resultB?.output) {
      cozeResultB.value = {
        p1: resultB.output.p1 || [],
        p2: resultB.output.p2 || [],
        p3: resultB.output.p3 || [],
        p4: resultB.output.p4 || []
      }
      console.log('[整理] 保存的 cozeResultB:', cozeResultB.value)
    }
    
    // 开始动画流程
    await playOrganizeAnimation()
    
    // ElMessage.success('观点整理完成')
  } catch (error) {
    console.error('[整理] 调用失败:', error)
    // ElMessage.error('观点分析失败，请重试')
  }
}

// 整理动画流程
const playOrganizeAnimation = async () => {
  // 关闭提炼模式，进入整理模式
  isSummaryMode.value = false
  isOrganizeMode.value = true
  
  // 阶段1: 显示所有 items（不带卡片框）
  organizeAnimationStage.value = 1
  console.log('[整理动画] 阶段1: 显示所有条目')
  
  // 计算所有 items 的总数，用于控制动画时长
  const totalItemsA = Object.values(cozeResultA.value).reduce((sum, arr) => sum + arr.length, 0)
  const totalItemsB = Object.values(cozeResultB.value).reduce((sum, arr) => sum + arr.length, 0)
  const totalItems = totalItemsA + totalItemsB
  
  // 等待所有 items 出现动画完成（每个 item 50ms 延迟 + 400ms 动画）
  await new Promise(resolve => setTimeout(resolve, totalItems * 80 + 600))
  
  // 阶段2: 显示卡片框（将 items 包裹起来）
  organizeAnimationStage.value = 2
  console.log('[整理动画] 阶段2: 显示卡片框，归类条目')
  
  // 等待卡片框动画完成
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  // 阶段3: 显示标题（带脉冲效果）
  organizeAnimationStage.value = 3
  console.log('[整理动画] 阶段3: 显示标题')
  
  // 等待标题脉冲动画
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // 启动标题打字机效果
  startTitleTyping()
}

</script>

<style scoped>
.page {
  padding: 0;
  width: 1240px;
  margin: 0 auto;
  background: #F5F5F0;
}

.stats-section {
  padding: 40px 0;
}

.activity-header {
  text-align: center;
  margin-bottom: 32px;
}

.activity-title {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 对战区域 */
.battle-container {
  position: relative;
}

/* 整理卡片 */
.organize-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.organize-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.organize-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.organize-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.organize-item {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.organize-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.organize-item:nth-child(1) {
  border-top: 3px solid #8b5cf6;
}

.organize-item:nth-child(2) {
  border-top: 3px solid #3b82f6;
}

.organize-item:nth-child(3) {
  border-top: 3px solid #10b981;
}

.organize-item:nth-child(4) {
  border-top: 3px solid #f59e0b;
}

.organize-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.organize-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.organize-item-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.organize-item-content {
  width: 100%;
}

.organize-item-content :deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  line-height: 1.6;
  transition: all 0.3s ease;
}

.organize-item-content :deep(.el-textarea__inner):focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.battle-arena {
  display: grid;
  grid-template-columns: 1fr 100px 1fr;
  align-items: start;
  gap: 0;
  min-height: 300px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 观点方容器 */
.opinion-side {
  background: #fafafa;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.side-a {
  grid-column: 1;
  border-top: 5px solid #3b82f6;
  background: linear-gradient(180deg, #f0f9ff 0%, #fafafa 60px);
}

.side-b {
  grid-column: 3;
  border-top: 5px solid #ef4444;
  background: linear-gradient(180deg, #fef2f2 0%, #fafafa 60px);
}

/* 方向头部 */
.side-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.side-title {
  font-size: 32px;
  font-weight: 900;
  margin: 0;
}

.side-a .side-title {
  color: #3b82f6;
}

.side-b .side-title {
  color: #ef4444;
}

.side-badge {
  font-size: 24px;
  font-weight: 700;
  padding: 4px 16px;
  border-radius: 12px;
  background: #f3f4f6;
  color: #6b7280;
}

.side-a .side-badge {
  background: #dbeafe;
  color: #1e40af;
}

.side-b .side-badge {
  background: #fee2e2;
  color: #991b1b;
}

/* 提炼卡片样式 */
.summary-card {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 2px solid;
  animation: slideInDown 0.5s ease-out;
  position: relative;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.summary-card.card-a {
  border-color: #3b82f6;
  background: white;
}

.summary-card.card-b {
  border-color: #ef4444;
  background: white;
}

/* 加载中的脉冲点 */
.loading-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
}

.loading-dots .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  opacity: 0.4;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.summary-card.card-a .loading-dots .dot {
  background: #3b82f6;
}

.summary-card.card-b .loading-dots .dot {
  background: #ef4444;
}

.loading-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.loading-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  40% {
    opacity: 1;
    transform: scale(1.3);
  }
}

/* 提炼卡片内容 */
.summary-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
  min-height: 32px;
}

.summary-text {
  font-size: 20px;
  line-height: 1.6;
  word-break: break-word;
  color: #1f2937;
  font-weight: 600;
  text-align: center;
}

/* 卡片容器 - 弹性居中布局 */
.cards-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  justify-content: center;
  align-content: start;
  max-width: 100%;
  flex: 1;
  min-height: 200px;
  transition: all 0.5s ease;
}

/* 提炼模式 - 两列布局 */
.cards-wrapper.refine-mode {
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* 整理模式 - 两列布局 */
.cards-wrapper.organize-mode {
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

/* 整理模式阶段1 - 单列瀑布流 */
.cards-wrapper.organize-stage-1 {
  grid-template-columns: 1fr;
  gap: 10px;
}

/* 阶段1: 漂浮的 item */
.coze-item-floating {
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border-left: 3px solid;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  animation: floatItemIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.coze-item-floating.card-a {
  border-left-color: #3b82f6;
  background: linear-gradient(90deg, #eff6ff 0%, #ffffff 20%);
}

.coze-item-floating.card-b {
  border-left-color: #ef4444;
  background: linear-gradient(90deg, #fef2f2 0%, #ffffff 20%);
}

@keyframes floatItemIn {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  60% {
    opacity: 1;
    transform: translateY(-8px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 观点卡片 - 弹性宽度设计 */
.opinion-card {
  width: 100%;
  max-width: 300px;
  min-width: 200px;
  height: 200px;
  padding: 12px;
  border-radius: 12px;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin: 0 auto;
}

.card-a {
  border-color: #93c5fd;
  background: #eff6ff;
}

.card-b {
  border-color: #fca5a5;
  background: #fef2f2;
}

.opinion-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.card-a:hover {
  border-color: #3b82f6;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.2);
  background: #dbeafe;
}

.card-b:hover {
  border-color: #ef4444;
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.2);
  background: #fee2e2;
}

/* 卡片内容 */
.card-group {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  color: white;
  align-self: flex-start;
}

.card-a .card-group {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.card-b .card-group {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.card-reasons {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 4px 2px;
}

.card-reasons::-webkit-scrollbar {
  width: 4px;
}

.card-reasons::-webkit-scrollbar-track {
  background: transparent;
}

.card-reasons::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.card-reasons::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.reason {
  font-size: 15px;
  line-height: 1.6;
  color: #1f2937;
  padding: 8px 10px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  font-weight: 500;
  transition: all 0.2s ease;
}

.reason:hover {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  transform: translateX(2px);
}

.card-a .reason {
  border-left-color: #3b82f6;
  background: rgba(255, 255, 255, 0.95);
}

.card-b .reason {
  border-left-color: #ef4444;
  background: rgba(255, 255, 255, 0.95);
}

/* 提炼模式 - reason 样式 */
.reason-item {
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  animation: fadeInUp 0.4s ease-out backwards;
}

.reason-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.reason-a {
  border-left-color: #3b82f6;
  background: linear-gradient(90deg, #eff6ff 0%, #ffffff 20%);
}

.reason-b {
  border-left-color: #ef4444;
  background: linear-gradient(90deg, #fef2f2 0%, #ffffff 20%);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 为每个 reason-item 添加延迟动画 */
.reason-item:nth-child(1) { animation-delay: 0s; }
.reason-item:nth-child(2) { animation-delay: 0.05s; }
.reason-item:nth-child(3) { animation-delay: 0.1s; }
.reason-item:nth-child(4) { animation-delay: 0.15s; }
.reason-item:nth-child(5) { animation-delay: 0.2s; }
.reason-item:nth-child(6) { animation-delay: 0.25s; }
.reason-item:nth-child(7) { animation-delay: 0.3s; }
.reason-item:nth-child(8) { animation-delay: 0.35s; }
.reason-item:nth-child(9) { animation-delay: 0.4s; }
.reason-item:nth-child(10) { animation-delay: 0.45s; }
.reason-item:nth-child(11) { animation-delay: 0.5s; }
.reason-item:nth-child(12) { animation-delay: 0.55s; }
.reason-item:nth-child(13) { animation-delay: 0.6s; }
.reason-item:nth-child(14) { animation-delay: 0.65s; }

/* Coze 分析结果卡片 */
.coze-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid transparent;
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 150px;
  max-height: 400px;
  opacity: 0;
  transform: scale(0.9);
}

/* 阶段2: 显示卡片框 */
.coze-card.show-box {
  opacity: 1;
  transform: scale(1);
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  animation: cardBoxIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes cardBoxIn {
  0% {
    opacity: 0;
    transform: scale(0.85);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

.coze-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.coze-card.card-a {
  border-color: #93c5fd;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 40px);
}

.coze-card.card-b {
  border-color: #fca5a5;
  background: linear-gradient(180deg, #fef2f2 0%, #ffffff 40px);
}

.coze-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f3f4f6;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.5s ease;
}

/* 阶段3: 显示标题 */
.coze-card.show-header .coze-card-header {
  opacity: 1;
  transform: translateY(0);
}

/* 标题脉冲效果 */
.coze-card-header.header-pulse {
  animation: headerPulse 1.5s ease-out;
}

@keyframes headerPulse {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  25% {
    opacity: 0.5;
    transform: translateY(-5px) scale(0.95);
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.5);
  }
  50% {
    opacity: 1;
    transform: translateY(0) scale(1.05);
    box-shadow: 0 0 0 20px rgba(59, 130, 246, 0.2);
  }
  75% {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 0 0 30px rgba(59, 130, 246, 0);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

.coze-icon {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.coze-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.coze-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 4px;
}

.coze-card-content::-webkit-scrollbar {
  width: 4px;
}

.coze-card-content::-webkit-scrollbar-track {
  background: transparent;
}

.coze-card-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.coze-card-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.coze-item {
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border-left: 3px solid;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.coze-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transform: translateX(2px);
}

.card-a .coze-item {
  border-left-color: #3b82f6;
  background: rgba(239, 246, 255, 0.5);
}

.card-b .coze-item {
  border-left-color: #ef4444;
  background: rgba(254, 242, 242, 0.5);
}

/* 空状态 */
.empty-state {
  width: 100%;
  padding: 60px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* VS 分隔符 */
.vs-divider {
  grid-column: 2;
  display: flex;
  align-items: center;
  align-self: center;
  justify-content: center;
  padding: 0 20px;
  transition: all 0.5s ease;
}

/* VS 按钮居中模式 - 提炼和整理时 */
.vs-divider.vs-centered {
  align-items: center;
  align-self: center;
}

/* VS 翻转容器 */
.vs-badge-container {
  width: 80px;
  height: 80px;
  min-width: 80px;
  min-height: 80px;
  perspective: 1500px;
  cursor: pointer;
  flex-shrink: 0;
}

.vs-badge-flip {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.vs-badge-container:hover .vs-badge-flip {
  transform: rotateY(180deg);
}

.vs-badge-front,
.vs-badge-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 28px;
  font-weight: 900;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.3s ease;
}

.vs-badge-front {
  background: white;
  color: #6b7280;
  border: 3px solid #e5e7eb;
  transform: rotateY(0deg);
}

.vs-badge-back {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: 3px solid #3b82f6;
  transform: rotateY(180deg);
  font-size: 20px;
  font-weight: 700;
}

.vs-badge-container:hover .vs-badge-front {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.vs-badge-container:hover .vs-badge-back {
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
}

.vs-badge-container:active .vs-badge-flip {
  transform: rotateY(180deg) scale(0.96);
  transition: transform 0.2s ease;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .page {
    width: 100%;
    padding: 0 16px;
  }

  .battle-arena {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto auto auto;
    gap: 40px;
  }

  .side-a {
    grid-column: 1;
    grid-row: 1;
  }
  
  .vs-divider {
    grid-column: 1;
    grid-row: 2;
  }
  
  .side-b {
    grid-column: 1;
    grid-row: 3;
  }

  .organize-content {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .activity-title {
    font-size: 28px;
  }

  .side-title {
    font-size: 24px;
  }

  .vs-badge {
    width: 60px;
    height: 60px;
    min-width: 60px;
    min-height: 60px;
    font-size: 20px;
  }

  .cards-wrapper {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    justify-content: center;
    gap: 12px;
  }
  
  .opinion-card {
    min-width: 200px;
    max-width: 300px;
  }

  .organize-content {
    grid-template-columns: 1fr;
  }

  .organize-title {
    font-size: 20px;
  }
}
</style>
