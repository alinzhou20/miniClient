<template>
  <div class="page">
    <div class="activity-header">
      <h2 class="activity-title">💭 Activity 1: 观点交锋方法初探</h2>
    </div>

    <div class="main-content">
      <div class="left-panel">
        <div class="cards-wrapper">
    <!-- 活动说明 -->
          <div class="card">
            <h3 class="card-title">📋 活动说明</h3>
            <div class="instruction-content">
              <ol class="instruction-list">
                <li>请在调查问卷中勾选小组的观点</li>
                <li>小组讨论写出你们的两条理由，写在调查问卷第2题</li>
                <li>在右侧AI助手中点击你的观点，获取AI提示支撑你的观点</li>
                <li>填写完成后，点击"拍照上传"，小组合作将调查问卷拍摄上传</li>
              </ol>
            </div>
    </div>

          <!-- 拍照上传 -->
          <div class="card">
            <h3 class="card-title">📷 拍照上传</h3>
            
            <!-- 已拍照片预览 -->
            <div v-if="capturedPhoto" class="photo-preview">
              <img :src="capturedPhoto" alt="已拍照片" class="preview-img" />
              
              <!-- 识别状态 -->
              <div v-if="isRecognizing" class="recognition-status">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <span>正在识别手写内容...</span>
          </div>
          
              <!-- 识别结果 -->
              <div v-if="recognitionResult" class="recognition-result">
                <div class="result-header">✅ 识别完成</div>
                <div class="result-content">{{ formatRecognitionResult(recognitionResult) }}</div>
          </div>
          
              <el-button type="warning" size="small" @click="retakePhoto" class="retake-btn">
                <el-icon><Camera /></el-icon> 重新拍照
              </el-button>
        </div>

            <!-- 摄像头区域 -->
            <div v-else-if="!showCamera" class="camera-initial">
              <el-button type="primary" size="large" @click="showCamera = true; initCamera()">
                <el-icon><Camera /></el-icon> 启动摄像头
              </el-button>
            </div>
            <div v-else class="camera-preview-wrapper">
              <video ref="videoRef" class="camera-preview" autoplay muted playsinline></video>
          <div v-if="isLoading" class="loading-overlay">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>正在启动摄像头...</p>
          </div>
          <div v-if="cameraError" class="error-overlay">
            <el-icon class="error-icon"><Warning /></el-icon>
            <p>{{ cameraError }}</p>
            <el-button type="primary" @click="initCamera">重新尝试</el-button>
              </div>
            </div>
            <div v-if="showCamera && isCameraReady" class="camera-controls">
              <el-button type="success" size="large" :loading="isUploading" @click="capture" class="capture-btn">
                <el-icon v-if="!isUploading"><Camera /></el-icon> {{ isUploading ? '拍照中...' : '拍照' }}
              </el-button>
              <el-button size="large" @click="closeCamera">关闭</el-button>
          </div>
        </div>
        
          <!-- 自我评价 -->
          <div class="card">
            <h3 class="card-title">⭐ 自我评价</h3>
            <div class="evaluation-content">
              <div class="evaluation-hint">请根据完成情况打分（最多3星）</div>
              <div class="evaluation-list">
                <div v-for="(text, i) in criteria" :key="i" class="evaluation-item">
                  <div class="criterion-text">{{ i + 1 }}. {{ text }}</div>
                  <div class="star-rating">
                    <el-icon v-for="s in 3" :key="s" class="star-icon" :class="{ 'active': s <= ratings[i] }" @click="ratings[i] = s">
                      <StarFilled v-if="s <= ratings[i]" />
                      <Star v-else />
                    </el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div v-if="canSubmit" class="submit-section">
          <el-button type="success" size="large" @click="submit" class="submit-btn" :loading="isSubmitting">
            <el-icon v-if="!isSubmitting"><CircleCheck /></el-icon> 
            {{ activity.ac1_stuResult ? '重新提交作品' : '提交作品' }}
          </el-button>
        </div>

        <!-- 提交历史 -->
        <div v-if="activity.ac1_stuResult" class="submit-history">
          <div class="history-header">
            <el-icon class="history-icon"><CircleCheck /></el-icon>
            <span>最近提交记录</span>
            </div>
          <div class="history-info">
            <div class="history-item">
              <span class="label">提交时间：</span>
              <span class="value">{{ submittedTime }}</span>
          </div>
            <div class="history-item">
              <span class="label">选择观点：</span>
              <span class="value">观点{{ activity.ac1_stuResult.viewpoint }}</span>
            </div>
            <div class="history-item">
              <span class="label">评价星数：</span>
              <span class="value">{{ activity.ac1_stuResult.ratings.join('⭐ / ') }}⭐</span>
          </div>
        </div>
      </div>
    </div>

      <!-- 右侧AI助手 -->
      <div class="right-panel">
        <div ref="aiChatRef" class="ai-chat" :class="{ 'fixed': isAiFixed }">
          <div class="ai-header">
            <div class="ai-avatar">🤖</div>
            <div class="ai-title">AI学习助手</div>
          </div>
          
          <div class="ai-body">
            <!-- 欢迎 -->
            <div v-if="aiMessages.length === 0" class="welcome">
              <div class="ai-msg">
                <div class="ai-icon">🤖</div>
                <div class="msg-content">
                  <p>你好！我是AI学习助手。</p>
                  <p>请选择你的观点，我会为你提供学习建议：</p>
                </div>
              </div>
              <div class="viewpoint-btns">
                <div class="vp-btn vp-a" @click="selectAndAsk('A')">
                  <div class="vp-icon">🔴</div>
                  <div class="vp-text">
                    <div class="vp-title">观点A</div>
                    <div class="vp-desc">使用数字设备利大于弊</div>
                  </div>
                </div>
                <div class="vp-btn vp-b" @click="selectAndAsk('B')">
                  <div class="vp-icon">🔵</div>
                  <div class="vp-text">
                    <div class="vp-title">观点B</div>
                    <div class="vp-desc">使用数字设备弊大于利</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 对话 -->
            <div v-else class="messages" ref="messagesRef">
              <div v-for="msg in aiMessages" :key="msg.id" class="msg-item" :class="msg.type">
                <div v-if="msg.type === 'ai'" class="ai-msg">
                  <div class="ai-icon">🤖</div>
                  <div class="msg-content">{{ msg.content }}</div>
                </div>
                <div v-else class="user-msg">
                  <div class="msg-content">{{ msg.content }}</div>
                </div>
              </div>
              <div v-if="isAsking" class="msg-item ai">
                <div class="ai-msg">
                  <div class="ai-icon">🤖</div>
                  <div class="msg-content">
                    <div class="typing"><span></span><span></span><span></span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 输入 -->
          <div class="ai-footer">
            <el-input v-model="userInput" placeholder="输入你的问题..." @keyup.enter="sendMsg">
              <template #append>
                <el-button @click="sendMsg" :disabled="!userInput.trim() || isAsking" :icon="isAsking ? Loading : ChatDotRound">
                  发送
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </div>

    <canvas ref="canvasRef" style="display: none;"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import { useActivity, type Activity1Submission } from '@/store/activity'
import { EntityMode } from '@/types'
import { ElMessage } from 'element-plus'
import { CircleCheck, Camera, Loading, Warning, ChatDotRound, Star, StarFilled } from '@element-plus/icons-vue'

const status = useStatus()
const socket = useSocket()
const activity = useActivity()
const groupNo = computed(() => String(status.userStatus?.groupNo ?? ''))

// 状态
const selectedViewpoint = ref<'A'|'B'|null>(null)
const ratings = ref([0, 0, 0])
const capturedPhoto = ref('')
const aiMessages = ref<{id:string, type:'ai'|'user', content:string, timestamp:number}[]>([])
const criteria = ['我能够亮明我的观点', '我能够通过小组讨论写出两条理由', '我能够通过网络获取更多数据']

// 摄像头
const showCamera = ref(false)
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const mediaStream = ref<MediaStream|null>(null)
const isLoading = ref(false)
const cameraError = ref('')
const isCameraReady = ref(false)
const isUploading = ref(false)
const isSubmitting = ref(false)
const isRecognizing = ref(false)
const recognitionResult = ref<any>(null)

// AI
const isAsking = ref(false)
const userInput = ref('')
const messagesRef = ref<HTMLElement>()
const aiChatRef = ref<HTMLElement>()
const isAiFixed = ref(false)
const aiTopOffset = ref(0)
const submittedTime = ref('')

const TOKEN = 'sat_3NtHyM2cY3Un8anULY7pAp9bLwLMdW9sVH4CRcfZC8G378M5OrT4dS2TzeAZQ2vg'
const WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7554010166815899682' // AI助手工作流ID
const UPLOAD_URL = 'https://api.coze.cn/v1/files/upload'
const RECOGNITION_WORKFLOW_ID = '7553827536788193322' // 手写识别工作流ID

const getViewpointMeaning = (v: 'A'|'B'|null) => v === 'A' ? '使用数字设备利大于弊' : v === 'B' ? '使用数字设备弊大于利' : ''

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
}

// AI对话
const selectAndAsk = async (vp: 'A'|'B') => {
  selectedViewpoint.value = vp
  aiMessages.value.push({ id: `u${Date.now()}`, type: 'user', content: `我选择观点${vp}：${getViewpointMeaning(vp)}`, timestamp: Date.now() })
  await askAI(vp)
}

const sendMsg = async () => {
  if (!userInput.value.trim() || isAsking.value) return
  const content = userInput.value.trim()
  userInput.value = ''
  aiMessages.value.push({ id: `u${Date.now()}`, type: 'user', content, timestamp: Date.now() })
  scrollToBottom()
  await askAI(selectedViewpoint.value || 'A', content)
}

const askAI = async (vp: 'A'|'B', question?: string) => {
  isAsking.value = true
  scrollToBottom()
  try {
    const res = await fetch(WORKFLOW_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow_id: WORKFLOW_ID, parameters: { input_type: question || `请为支持"${getViewpointMeaning(vp)}"这个观点提供学习建议和论据` } })
    })
    if (!res.ok) throw new Error()
    const result = await res.json()
    if (result.code === 0 && result.data) {
      const data = JSON.parse(result.data)
      const output = data.output || []
      const reply = Array.isArray(output) ? output.slice(0, 3).filter((t:string) => t?.trim()).join('\n\n') : ''
      if (reply) {
        aiMessages.value.push({ id: `ai${Date.now()}`, type: 'ai', content: reply, timestamp: Date.now() })
        scrollToBottom()
      }
    }
  } catch {
    aiMessages.value.push({ id: `e${Date.now()}`, type: 'ai', content: '抱歉，我遇到了一些问题。请稍后再试。', timestamp: Date.now() })
    scrollToBottom()
  } finally {
    isAsking.value = false
  }
}

// 摄像头
const initCamera = async () => {
  isLoading.value = true
  cameraError.value = ''
  try {
    if (mediaStream.value) mediaStream.value.getTracks().forEach(t => t.stop())
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' } })
    mediaStream.value = stream
    if (videoRef.value) videoRef.value.srcObject = stream
    isCameraReady.value = true
  } catch (error: any) {
    cameraError.value = error.name === 'NotAllowedError' ? '摄像头权限被拒绝' : '摄像头启动失败'
  } finally {
    isLoading.value = false
  }
}

const capture = async () => {
  if (!videoRef.value || !canvasRef.value || !isCameraReady.value) return
  isUploading.value = true
  
  try {
    const ctx = canvasRef.value.getContext('2d')
    if (!ctx) throw new Error('Canvas错误')
    
    canvasRef.value.width = videoRef.value.videoWidth
    canvasRef.value.height = videoRef.value.videoHeight
    ctx.drawImage(videoRef.value, 0, 0)
    
    // 获取base64图片并保存
    capturedPhoto.value = canvasRef.value.toDataURL('image/jpeg', 0.9)
    
    // 关闭摄像头
    closeCamera()
    ElMessage.success('拍照成功！正在识别手写内容...')
    
    // 开始识别手写内容
    await recognizeHandwriting(capturedPhoto.value)
    
  } catch (error) {
    console.error('[Activity1] 拍照失败:', error)
    ElMessage.error('拍照失败，请重试')
  } finally {
    isUploading.value = false
  }
}

const closeCamera = () => {
  showCamera.value = false
  if (mediaStream.value) { mediaStream.value.getTracks().forEach(t => t.stop()); mediaStream.value = null }
  isCameraReady.value = false
}

// 转换base64为File对象
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

// 上传图片到Coze，返回file_id
const uploadImage = async (dataUrl: string): Promise<string | null> => {
  try {
    const filename = `handwriting_${Date.now()}.jpg`
    const file = dataURLtoFile(dataUrl, filename)
    
    const formData = new FormData()
    formData.append('file', file)
    
    const uploadResponse = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      },
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error('图片上传失败')
    }
    
    const uploadResult = await uploadResponse.json()
    console.log('[Activity1] 上传响应:', uploadResult)
    
    if (uploadResult.code !== 0 || !uploadResult.data?.id) {
      throw new Error('上传响应异常')
    }
    
    console.log('[Activity1] 图片上传成功，file_id:', uploadResult.data.id)
    return uploadResult.data.id
    
  } catch (error: any) {
    console.error('[Activity1] 图片上传失败:', error)
    return null
  }
}

// 识别手写内容
const recognizeHandwriting = async (dataUrl: string) => {
  isRecognizing.value = true
  
  try {
    // 1. 上传图片获取file_id
    const fileId = await uploadImage(dataUrl)
    
    if (!fileId) {
      throw new Error('图片上传失败')
    }
    
    // 2. 调用识别工作流
    const workflowPayload = {
      workflow_id: RECOGNITION_WORKFLOW_ID,
      parameters: {
        input_img: {
          file_id: fileId
        },
        input_index: 1 // Activity1 使用 index 1
      }
    }
    
    console.log('[Activity1] 开始手写识别:', workflowPayload)
    
    const workflowResponse = await fetch(WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowPayload)
    })
    
    if (!workflowResponse.ok) {
      throw new Error('识别工作流调用失败')
    }
    
    const workflowResult = await workflowResponse.json()
    console.log('[Activity1] 识别响应:', workflowResult)
    
    if (workflowResult.code !== 0) {
      throw new Error('识别工作流执行失败')
    }
    
    // 3. 解析识别结果
    if (workflowResult.data) {
      try {
        const resultData = JSON.parse(workflowResult.data)
        console.log('[Activity1] 识别结果:', resultData)
        recognitionResult.value = resultData
        
        // 🌟 自动打星
        autoRateFromRecognition(resultData)
        
        ElMessage.success('手写识别完成！已自动评分')
      } catch (parseError) {
        console.warn('[Activity1] 解析识别结果失败:', parseError)
        recognitionResult.value = { raw: workflowResult.data }
        ElMessage.warning('识别完成，但结果解析异常')
      }
    } else {
      ElMessage.warning('识别完成，但未返回结果')
    }
    
  } catch (error: any) {
    console.error('[Activity1] 手写识别失败:', error)
    ElMessage.error(`识别失败: ${error.message}`)
  } finally {
    isRecognizing.value = false
  }
}

// 🌟 根据识别结果自动打星
const autoRateFromRecognition = (result: any) => {
  try {
    // 提取output2数据
    const output2 = result.output2 || result.output || result
    console.log('[Activity1] 自动打星 - output2:', output2)
    
    // 规则1: q1有值（A或B）→ 第1条给1星
    if (output2.q1 && (output2.q1.toUpperCase() === 'A' || output2.q1.toUpperCase() === 'B')) {
      ratings.value[0] = 1
      console.log('[Activity1] q1检测到:', output2.q1, '→ 第1条: 1星')
      
      // 同时自动设置观点
      selectedViewpoint.value = output2.q1.toUpperCase() as 'A' | 'B'
    } else {
      ratings.value[0] = 0
    }
    
    // 规则2: q2的q2_1和q2_2
    if (output2.q2) {
      const hasQ2_1 = output2.q2.q2_1 && String(output2.q2.q2_1).trim().length > 0
      const hasQ2_2 = output2.q2.q2_2 && String(output2.q2.q2_2).trim().length > 0
      
      if (hasQ2_1 && hasQ2_2) {
        ratings.value[1] = 2  // 都有值 → 2星
        console.log('[Activity1] q2_1和q2_2都有值 → 第2条: 2星')
      } else if (hasQ2_1 || hasQ2_2) {
        ratings.value[1] = 1  // 只有1个 → 1星
        console.log('[Activity1] q2只有1个有值 → 第2条: 1星')
      } else {
        ratings.value[1] = 0  // 都没有 → 0星
        console.log('[Activity1] q2都没有值 → 第2条: 0星')
      }
    } else {
      ratings.value[1] = 0
    }
    
    // 规则3: q3有值 → 第3条给1星
    if (output2.q3 && String(output2.q3).trim().length > 0) {
      ratings.value[2] = 1
      console.log('[Activity1] q3有值:', output2.q3, '→ 第3条: 1星')
    } else {
      ratings.value[2] = 0
    }
    
    console.log('[Activity1] 最终评分:', ratings.value)
    
  } catch (error) {
    console.error('[Activity1] 自动打星失败:', error)
    // 失败时不修改评分，让用户手动打分
  }
}

// 格式化识别结果显示
const formatRecognitionResult = (result: any): string => {
  if (!result) return '无识别结果'
  
  try {
    // 优先显示output2的格式化内容
    const output2 = result.output2 || result.output || result
    if (output2.q1 || output2.q2 || output2.q3) {
      let text = ''
      if (output2.q1) text += `问题1: ${output2.q1}\n`
      if (output2.q2) {
        text += `问题2:\n`
        if (output2.q2.q2_1) text += `  理由1: ${output2.q2.q2_1}\n`
        if (output2.q2.q2_2) text += `  理由2: ${output2.q2.q2_2}\n`
      }
      if (output2.q3) text += `问题3: ${output2.q3}`
      return text
    }
    
    // 尝试提取其他常见字段
    if (result.output) return result.output
    if (result.text) return result.text
    if (result.content) return result.content
    
    // 如果是对象，转为JSON显示
    return JSON.stringify(result, null, 2)
  } catch {
    return String(result)
  }
}

// 重新拍照
const retakePhoto = () => {
  capturedPhoto.value = ''
  recognitionResult.value = null
  showCamera.value = true
  initCamera()
}

// 提交
const canSubmit = computed(() => capturedPhoto.value && ratings.value.every(r => r > 0))

const submit = async () => {
  if (!groupNo.value || !canSubmit.value || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    const now = Date.now()
    const isResubmit = !!activity.ac1_stuResult
    
    const data: Activity1Submission = {
      viewpoint: selectedViewpoint.value,
      photo: capturedPhoto.value,
      ratings: [...ratings.value],
      recognitionResult: recognitionResult.value,
      submittedAt: now
    }
    
    // 保存到本地store
    activity.ac1_stuResult = data as any
    
    // 发送到教师端
    socket.submit({
      mode: EntityMode.GROUP,
      messageType: 'activity1',
      activityIndex: '1',
      data,
      from: { id: groupNo.value, groupNo: groupNo.value },
      to: null
    })
    
    submittedTime.value = new Date(now).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    
    ElMessage.success(isResubmit ? '作品已重新提交！' : '作品已成功提交！')
    
    console.log(`[Activity1 Student] 第${groupNo.value}组${isResubmit ? '重新' : ''}提交成功，时间: ${submittedTime.value}`)
  } catch (error) {
    console.error('[Activity1 Student] 提交失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 滚动跟随
const handleScroll = () => {
  if (!aiChatRef.value) return
  const scroll = window.pageYOffset || document.documentElement.scrollTop
  isAiFixed.value = scroll > aiTopOffset.value && aiChatRef.value.getBoundingClientRect().top <= 80
}

onMounted(() => {
  setTimeout(() => {
    if (aiChatRef.value) {
      aiTopOffset.value = window.pageYOffset + aiChatRef.value.getBoundingClientRect().top - 80
    }
  }, 100)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  if (mediaStream.value) mediaStream.value.getTracks().forEach(t => t.stop())
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.page {
  padding: 20px;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
  background: #F5F5F0;
  min-height: 100vh;
}

.activity-header {
  margin-bottom: 24px;
  text-align: center;
}

.activity-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  align-items: start;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.instruction-content {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
}

.instruction-list {
  margin: 0;
  padding-left: 20px;
  color: #374151;
  font-size: 14px;
  line-height: 1.8;
}

/* 照片预览 */
.photo-preview {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  max-height: 450px;
  object-fit: contain;
  border-radius: 12px;
  background: #1f2937;
  display: block;
}

.retake-btn {
  width: 100%;
  margin-top: 12px;
}

.recognition-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  margin-top: 12px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 12px;
  color: #1e40af;
  font-weight: 600;
}

.recognition-result {
  margin-top: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-radius: 12px;
  border: 2px solid #10b981;
}

.recognition-result .result-header {
  font-size: 16px;
  font-weight: 700;
  color: #065f46;
  margin-bottom: 12px;
  text-align: center;
}

.recognition-result .result-content {
  font-size: 14px;
  color: #047857;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.camera-initial {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
}

.camera-preview-wrapper {
  position: relative;
  width: 100%;
  height: 450px;
  background: #1f2937;
  border-radius: 12px;
  overflow: hidden;
}

.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.loading-overlay, .error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #ffffff;
}

.loading-overlay {
  background: rgba(0, 0, 0, 0.7);
}

.error-overlay {
  background: rgba(239, 68, 68, 0.8);
}

.loading-icon {
  font-size: 28px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.camera-controls {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.capture-btn {
  flex: 1;
}

.evaluation-content {
  padding: 16px 0;
}

.evaluation-hint {
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.evaluation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.evaluation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.criterion-text {
  font-size: 14px;
  color: #374151;
  flex: 1;
}

.star-rating {
  display: flex;
  gap: 4px;
}

.star-icon {
  font-size: 20px;
  color: #d1d5db;
  cursor: pointer;
}

.star-icon.active {
  color: #fbbf24;
}

.submit-section {
  text-align: center;
  animation: slideDown 0.4s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.submit-btn {
  width: 100%;
  max-width: 400px;
  height: 60px;
  font-size: 18px;
  font-weight: 700;
}

.submit-history {
  background: white;
  border: 2px solid #10b981;
  border-radius: 16px;
  padding: 20px;
  animation: slideDown 0.4s ease;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 700;
  color: #065f46;
}

.history-icon {
  font-size: 20px;
  color: #10b981;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #d1fae5;
  border-radius: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.history-item .label {
  color: #059669;
  font-weight: 600;
}

.history-item .value {
  color: #065f46;
  font-weight: 500;
}

/* AI助手 */
.right-panel {
  position: relative;
}

.ai-chat {
  width: 100%;
  height: calc(100vh - 140px);
  background: white;
  border: 2px solid #B6E1FF;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(182, 225, 255, 0.3);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.ai-chat.fixed {
  position: fixed;
  right: 20px;
  top: 80px;
  width: 380px;
  z-index: 100;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 2px solid #B6E1FF;
  background: linear-gradient(135deg, #B6E1FF, #8EC5FC);
  border-radius: 14px 14px 0 0;
}

.ai-avatar {
  font-size: 32px;
}

.ai-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.ai-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f0f9ff;
}

.welcome {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-msg {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.ai-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.msg-content {
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #374151;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
}

.msg-content p {
  margin: 0 0 8px 0;
}

.msg-content p:last-child {
  margin: 0;
}

.viewpoint-btns {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vp-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.vp-btn:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.vp-btn.vp-a:hover {
  border-color: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.vp-icon {
  font-size: 24px;
}

.vp-text {
  flex: 1;
}

.vp-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.vp-desc {
  font-size: 12px;
  color: #6b7280;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.msg-item {
  animation: fadeIn 0.3s ease;
}

.msg-item.user {
  display: flex;
  justify-content: flex-end;
}

.user-msg {
  max-width: 80%;
}

.user-msg .msg-content {
  background: #3b82f6;
  color: white;
}

.typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing span {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-8px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.ai-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: white;
  border-radius: 0 0 16px 16px;
}

@media (max-width: 1024px) {
  .main-content { grid-template-columns: 1fr; }
  .ai-chat.fixed { position: relative; width: 100%; }
}
</style>
