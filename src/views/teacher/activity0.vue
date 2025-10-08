<template>
  <div class="page">
    <!-- 拍照组件 -->
    <div v-if="showCamera" class="camera-section">
      <TeacherCamera @upload="handleUpload" @exit="handleExit" />
    </div>

    <!-- 结果展示区域 -->
    <div class="stats-section">
      <!-- 活动标题 -->
      <div class="activity-header">
        <h2 class="activity-title">🎯 观点统计</h2>
      </div>

      <!-- 照片分析中 -->
      <div v-if="hasPhoto && !activity.ac0_voteResult" class="analyzing-section">
        <div v-if="isAnalyzing" class="analyzing-content">
          <el-icon class="analyzing-icon"><Loading /></el-icon>
          <p class="analyzing-text">正在分析照片...</p>
        </div>
      </div>

      <!-- 观点对抗区域 -->
      <div v-else class="battle-container">
        <div 
          class="battle-arena" 
          :style="battleGridStyle"
        >
          <!-- 正方卡片 -->
          <div class="opinion-card opinion-a">
            <div class="card-header">
              <h3 class="card-title">A</h3>
              <div v-if="activity.ac0_voteResult && totalCount > 0" class="card-count">
                {{ activity.ac0_voteResult.countA }}人
              </div>
            </div>
            <div class="card-content">
              <div class="card-opinion">
                <div class="opinion-line-head">使用数字设备</div>
                <div class="opinion-line-body">利大于弊</div>
              </div>
            </div>
          </div>

          <!-- VS 分隔符 -->
          <div class="vs-divider" @click="handleCameraAction">
            <div class="vs-badge">VS</div>
          </div>

          <!-- 反方卡片 -->
          <div class="opinion-card opinion-b">
            <div class="card-header">
              <h3 class="card-title">B</h3>
              <div v-if="activity.ac0_voteResult && totalCount > 0" class="card-count">
                {{ activity.ac0_voteResult.countB }}人
              </div>
            </div>
            <div class="card-content">
              <div class="card-opinion">
                <div class="opinion-line-head">使用数字设备</div>
                <div class="opinion-line-body">弊大于利</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
// import { ElMessage, ElButton } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useActivity } from '@/store/activity'
import TeacherCamera from '@/views/components/TeacherCamera.vue'
import { useCoze, WORKFLOW } from '@/utils/coze'

const activity = useActivity()
const { uploadFile, runWorkflow } = useCoze()

// 拍摄状态
const showCamera = ref(false)
const hasPhoto = ref(false)
const isAnalyzing = ref(false)

// 计算属性
const totalCount = computed(() => {
  if (!activity.ac0_voteResult) {
    console.log('[Activity0] 📊 totalCount: 没有投票结果')
    return 0
  }
  const total = activity.ac0_voteResult.countA + activity.ac0_voteResult.countB
  console.log('[Activity0] 📊 totalCount:', total, '(A:', activity.ac0_voteResult.countA, ', B:', activity.ac0_voteResult.countB, ')')
  return total
})

// 计算网格样式（根据人数比例分配列宽）
const battleGridStyle = computed(() => {
  if (!activity.ac0_voteResult || totalCount.value === 0) {
    // 没有结果时，两边等宽
    return {
      gridTemplateColumns: '1fr 100px 1fr'
    }
  }
  
  // 有结果时，根据人数比例分配
  const countA = activity.ac0_voteResult.countA
  const countB = activity.ac0_voteResult.countB
  
  // 计算比例，至少保持 0.3，避免卡片太窄
  const ratioA = Math.max(countA / totalCount.value, 0.3)
  const ratioB = Math.max(countB / totalCount.value, 0.3)
  
  // 归一化比例（因为可能都被调整到最小值）
  const total = ratioA + ratioB
  const normalizedA = ratioA / total
  const normalizedB = ratioB / total
  
  return {
    gridTemplateColumns: `${normalizedA}fr 100px ${normalizedB}fr`
  }
})

// 处理摄像头操作（重置并拍摄）
const handleCameraAction = () => {
  // 重置所有数据
  hasPhoto.value = false
  isAnalyzing.value = false
  activity.ac0_voteResult = null
  activity.ac0_photo = ''
  
  // 打开摄像头
  showCamera.value = true
}

// 处理上传
const handleUpload = async (photo: string) => {
  hasPhoto.value = true
  showCamera.value = false
  // ElMessage.success('照片已拍摄')
  startAnalysis(photo)
}

// 处理退出
const handleExit = () => {
  showCamera.value = false
  // ElMessage.info('已关闭摄像头')
}

// 开始分析
const startAnalysis = async (dataUrl: string) => {
  isAnalyzing.value = true
  // ElMessage.info('开始分析照片...')
  
  try {
    console.log('[Activity0] 📸 开始上传图片...')
    // 使用 coze.ts 的 uploadFile 上传图片
    const fileId = await uploadFile(dataUrl, `activity0_${Date.now()}.jpg`)
    console.log('[Activity0] 📤 图片上传结果:', fileId)
    
    if (!fileId) throw new Error('图片上传失败')
    
    console.log('[Activity0] 🚀 开始调用工作流...')
    // 使用 coze.ts 的 runWorkflow 分析图片
    const workflowParams = { img: { file_id: fileId }, index: 0 }
    console.log('[Activity0] 📋 工作流参数:', workflowParams)
    
    const workflowResult = await runWorkflow(WORKFLOW.GET_PICTURE, workflowParams)
    console.log('[Activity0] 🎯 工作流返回结果:', workflowResult)
    
    const { countA, countB } = parseAnalysisResult(workflowResult)
    console.log('[Activity0] 📊 解析后的人数: countA =', countA, ', countB =', countB)

    // 设置投票结果
    activity.ac0_voteResult = {
      countA,
      countB,
      timestamp: Date.now()
    }
    
    console.log('[Activity0] ✅ 投票结果已设置:', activity.ac0_voteResult)
    // ElMessage.success(`分析完成！正方 ${countA} 人，反方 ${countB} 人`)
  } catch (error) {
    console.error('[Activity0] ❌ 分析失败:', error)
    // ElMessage.error('分析失败，请重试')
    // 不设置默认结果，让用户可以重新拍照
  } finally {
    isAnalyzing.value = false
  }
}

// 解析分析结果
const parseAnalysisResult = (data: any): { countA: number, countB: number } => {
  let countA = 0
  let countB = 0
  
  console.log('[Activity0] 🔍 开始解析工作流返回数据:', data)
  
  try {
    // 如果 data 已经是对象，直接使用；否则尝试解析
    const analysisData = typeof data === 'string' ? JSON.parse(data) : data
    console.log('[Activity0] 📦 解析后的数据:', analysisData)
    
    const output0 = analysisData.output0
    console.log('[Activity0] 📄 output0 内容:', output0)
    console.log('[Activity0] 📄 output0 类型:', typeof output0)
    
    if (output0) {
      try {
        // 尝试解析 output0（可能是 JSON 字符串）
        const countData = typeof output0 === 'string' ? JSON.parse(output0) : output0
        console.log('[Activity0] 🔢 解析出的计数数据:', countData)
        
        // 尝试多种可能的字段名
        countA = parseInt(countData.count_A || countData.countA || countData.A || '0', 10)
        countB = parseInt(countData.count_B || countData.countB || countData.B || '0', 10)
        
        console.log('[Activity0] ✅ 最终计数结果: countA =', countA, ', countB =', countB)
      } catch (e) {
        console.warn('[Activity0] ⚠️ 解析 output0 失败，尝试正则提取:', e)
        // 如果 JSON 解析失败，尝试正则表达式提取数字
        const outputStr = String(output0)
        const matchA = outputStr.match(/count[_-]?A[:\s]*(\d+)/i) || outputStr.match(/A[:\s]*(\d+)/i)
        const matchB = outputStr.match(/count[_-]?B[:\s]*(\d+)/i) || outputStr.match(/B[:\s]*(\d+)/i)
        countA = matchA ? parseInt(matchA[1], 10) : 0
        countB = matchB ? parseInt(matchB[1], 10) : 0
        console.log('[Activity0] 🔍 正则提取结果: countA =', countA, ', countB =', countB)
      }
    } else {
      console.warn('[Activity0] ⚠️ output0 为空或 undefined')
    }
  } catch (e) {
    console.error('[Activity0] ❌ 解析失败，使用默认值:', e)
  }
  
  return { countA, countB }
}
</script>

<style scoped>
.page {
  padding: 0;
  width: 1240px;
  margin: 0 auto;
  background: #F5F5F0;
}

/* 统计区域 */
.stats-section {
  padding: 40px 0;
}

/* 活动标题 */
.activity-header {
  text-align: center;
  margin-bottom: 48px;
}

.activity-title {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 拍摄区域 */
.camera-section {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
}

/* 分析中状态 */
.analyzing-section {
  padding: 100px 20px;
  text-align: center;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.analyzing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.analyzing-icon {
  font-size: 56px;
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

.analyzing-text {
  font-size: 20px;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 对战容器 */
.battle-container {
  position: relative;
}

.battle-arena {
  display: grid;
  grid-template-columns: 1fr 100px 1fr;
  align-items: stretch;
  gap: 0;
  min-height: 300px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 观点卡片 */
.opinion-card {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.opinion-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  transition: all 0.3s ease;
}

/* 正方卡片 */
.opinion-a {
  grid-column: 1;
}

.opinion-a::before {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.opinion-a:hover::before {
  height: 8px;
}

/* 反方卡片 */
.opinion-b {
  grid-column: 3;
}

.opinion-b::before {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.opinion-b:hover::before {
  height: 8px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.card-title {
  font-size: 46px;
  font-weight: 1000;
  margin: 0;
}

.opinion-a .card-title {
  color: #3b82f6;
}

.opinion-b .card-title {
  color: #ef4444;
}

.card-count {
  font-size: 48px;
  font-weight: 1000;
  animation: countAppear 0.5s ease;
}

.opinion-a .card-count {
  color: #3b82f6;
}

.opinion-b .card-count {
  color: #ef4444;
}

@keyframes countAppear {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 卡片内容 */
.card-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-opinion {
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: center;
  width: 100%;
}

.opinion-line-head {
  font-size: 32px;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.4;
  letter-spacing: 2px;
}

.opinion-line-body {
  font-size: 42px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 4px;
}

/* 正方观点颜色 */
.opinion-a .opinion-line-body {
  color: #3b82f6;
}

/* 反方观点颜色 */
.opinion-b .opinion-line-body {
  color: #ef4444;
}

/* VS 分隔符 */
.vs-divider {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0 20px;
}

.vs-badge {
  font-size: 28px;
  font-weight: 900;
  color: #6b7280;
  background: white;
  border: 3px solid #e5e7eb;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  min-width: 80px;
  min-height: 80px;
  max-width: 80px;
  max-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.vs-badge:hover {
  transform: scale(1.15) rotate(5deg);
  border-color: #3b82f6;
  color: #3b82f6;
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.3);
}

.vs-badge:active {
  transform: scale(0.95);
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
    min-height: auto;
    gap: 40px;
  }
  
  .opinion-card {
    width: 100%;
  }

  .opinion-a {
    grid-column: 1;
    grid-row: 1;
  }

  .vs-divider {
    grid-column: 1;
    grid-row: 2;
  }

  .opinion-b {
    grid-column: 1;
    grid-row: 3;
  }
}

@media (max-width: 768px) {
  .activity-title {
    font-size: 28px;
  }

  .card-title {
    font-size: 32px;
  }

  .card-count {
    font-size: 28px;
  }

  .card-opinion {
    gap: 12px;
  }

  .opinion-line-head {
    font-size: 24px;
    letter-spacing: 1px;
  }

  .opinion-line-body {
    font-size: 32px;
    letter-spacing: 2px;
  }

  .vs-badge {
    width: 60px;
    height: 60px;
    min-width: 60px;
    min-height: 60px;
    max-width: 60px;
    max-height: 60px;
    font-size: 20px;
  }
}
</style>
