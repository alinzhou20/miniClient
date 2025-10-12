<template>
  <div class="search-simulator">
    <!-- 统一操作按钮 -->
    <div class="btn-container">
      <button 
        v-if="!isSearching && !isLoadingPage && !showSummary"
        class="action-btn"
        @click="startSearch"
      >
        <span class="btn-icon">🔍</span>
        网络搜索
      </button>
      
      <button 
        v-if="showSummary"
        class="action-btn add-btn"
        @click="addToActivity"
      >
        <span class="btn-icon">➕</span>
        添加数据
      </button>
    </div>

    <!-- 搜索进行中 -->
    <div v-if="isSearching" class="search-container">
      <div class="phase-box">
        <div class="phase-title">
          <span>{{ currentPhase.icon }}</span>
          {{ currentPhase.title }}
        </div>
        <div class="phase-desc">{{ currentPhase.desc }}</div>
      </div>

      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: searchProgress + '%' }"></div>
        </div>
        <div class="progress-text">{{ searchProgress }}% - {{ searchingText }}</div>
      </div>

      <div class="logs-box" ref="logsContainer">
        <div 
          v-for="(log, index) in searchLogs" 
          :key="index"
          class="log-item"
          :class="{ highlight: log.highlight, final: log.isFinal }"
        >
          <div class="log-icon">
            <img :src="log.favicon" :alt="log.source" />
          </div>
          <div class="log-info">
            <div class="log-source">{{ log.source }}</div>
            <div class="log-text">{{ log.content }}</div>
            <div v-if="log.url" class="log-url">{{ log.url }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 网页加载阶段 -->
    <div v-if="isLoadingPage" class="loading-container">
      <div class="header-box">
        <div class="header-title">🎯 已找到最佳匹配网页</div>
        <div class="header-url">{{ targetUrl }}</div>
      </div>

      <div class="browser-box">
        <div class="browser-bar">
          <div class="browser-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="browser-url">🔒 {{ targetUrl }}</div>
        </div>
        
        <div class="browser-content">
          <div class="page-scroll" :style="{ transform: `translateY(-${scrollPosition}px)` }">
            <div class="article">
              <h1>明确数字技术资源 有效促进学习发展</h1>
              <div class="meta">
                <span>📅 2024-01-31</span>
                <span>📰 中国教育报</span>
              </div>
              
              <p>随着数字化技术的发展，席卷全球经济的数字技术正深刻改变着教育形态。在线学习平台、教育应用程序等数字技术工具为学生学习提供了前所未有的可能。经济合作与发展组织（OECD）发布的国际学生评估项目（PISA）为我们理解数字技术对学校教育的影响提供了独特视角。</p>
              
              <p>PISA汇集全球80个国家和地区21629所学校、613744名学生的数据，详细记录了数字技术在过去二十年间对学生学习生活的改变。数据显示，数字技术能够为学生学习赋能，但前提是正确获取、装配和使用设备。教师是否能有效引导学生进行数字技术的批判性和创造性使用，学生是否具备必要的数字技能和信息素养都是关键因素。</p>

              <h3>数字设备使用频率超过每天1小时，学生学业表现呈现下降态势</h3>
              
              <p>PISA证据表明，数字技术的可见性和即时性并不能保证高质量的学习。数字技术能够为学生的学习赋能，但前提是要能够正确获取、装配和使用这些数字资源。研究发现，学生若将手机等数字设备主要用于课外娱乐，课外数字设备使用频率超过每天1小时的临界值时，学生学业表现会呈现下降态势。</p>

              <p>其中一个原因是，过度使用数字设备可能会导致信息过载、注意力分散等问题，且挤占了原本应该用于阅读、睡眠等其他活动的时间，从而对学生身心的健康和学业发展带来负面影响。</p>

              <p>因此，在课外环境中给予更多的机制约束来使用数字设备，对数字技术发展对学生的影响却是更为稳健。虽然数字技术在教学中的应用与学生学习成绩之间存在微弱甚至负向的相关性，但这并不意味着教师和学校应该放弃使用数字技术教学。</p>

              <h3>学生是否具备规定和执行数字技术使用规则的能力是关键</h3>

              <p>PISA数据显示，若学生在任何时候都能够轻松接触和使用诸如手机等数字移动设备的情况下，越来越多的未成年人将缺乏自主思考和自我管理的能力。为了防止数字技术带来的负面效应，多个国家和地区禁止中小学生携带手机上课，或限定规则允许儿童接触某些电子游戏和视频内容。</p>

              <p>禁止在校内携带手机上课时，学生在课堂上使用手机机会受到限制，注意力更集中，学习效果也相应提高。但也有研究显示，在禁止学生携带手机上课却未能显著改善学生学习成绩的案例。一种可能的解释是，禁令未能得到有效执行；另一种可能的解释是教师们未能及时观察到学生在课堂上使用数字设备实施的到底是什么行为，以使这些数字设备成为课程的一部分。</p>

              <p>PISA数据进一步显示，当学生和教师共同制定了在课堂上使用数字设备的制度规范时，一般情况下，这些学生的阅读、数学和科学成绩都会更高。可见，数字技术的使用能够有效地促进学生的学习，而关键在于师生是否共同制定和执行数字技术的使用规则。</p>

              <h3>让数字技术成为学习工具，需把手机还给学生</h3>

              <p>PISA2022数据显示，当学生对数字技术持有积极态度，并支持学科教学时，他们对阅读、数学和科学学科的学习兴趣都会更强烈；相反，当学生只知道自己的行为被数字技术所监控，或被要求通过数字技术完成学习任务时，学生的阅读、数学和科学成绩会更低。由此可见，即使在课内和家庭及学校影响减弱的情况下，学生依然能够有效学习。</p>

              <p>可见，有效学习的始终都在等待着那些具备"主动"精神且能够独立自主地进行探索和发现的个体。如何在浩如烟海的信息海洋中不迷失方向、不随波逐流，需要学生掌握批判性思维和问题解决能力。数字技术为学生提供了跨越时空限制的"无边界"学习机会，但这也要求学生学会使用新技术进行适应性学习，而教师和教科书已无法及时提供这些新知识和新技能。因此，有必要转变态度，将手机还给学生。</p>

              <p>数字技术要实现为学生学习赋能的根本目标，不仅需要将数字技术与学生的使用数字技术联系起来，更需要与适应性学习和探索性学习联系起来。PISA调查数据表明，当教师明确支持学生使用数字技术进行探索式学习时，学生通过思考、沟通、协同合作等形式在真实的问题情境中解决问题，能够促进探索性和反思性行为的产生。</p>

              <p>探索式学习虽然允许学生频繁使用数字设备，但由于需要注意力集中，学生可以避免信息过载的问题。教师与学生共同使用数字设备来提高教学有效性，对于促进探索式学习与探究式学习的"路径转换"也是必要的。这一方面要求教师的角色从传统的知识传播者转变为学习的引导者，且具备数字技术的教学法技能，以及带领学生建立思维工具的能力。另一方面，数字技术还能够将教学中的问题呈现和学生的特点，提供更加个性化或适应性的教学方式，使每位学生成为积极主动的探索者。建立一个融合数字技术的适应性和探究性学习生态系统，是实现有效学习的必由之路。</p>

              <div class="article-info">
                （作者：刘莉莉、鄢婷婷，系重庆师范大学教育科学学院副教授；本文系重庆市社科规划培育项目成果）
              </div>
            </div>
          </div>
        </div>

        <div class="scroll-bar">
          <div class="scroll-thumb" :style="{ height: scrollThumbHeight + '%', top: scrollThumbPosition + '%' }"></div>
          <span>正在阅读分析... {{ Math.round(scrollProgress) }}%</span>
        </div>
      </div>

      <div class="tips-box">
        <div v-for="(tip, index) in analyzingTips" :key="index" class="tip">
          <span>{{ tip.icon }}</span>
          <span>{{ tip.text }}</span>
        </div>
      </div>
    </div>

    <!-- 最终总结 -->
    <div v-if="showSummary" class="summary-grid">
      <div class="column positive">
        <div class="column-header">👍 利大于弊</div>
        <div class="points">
          <div v-for="(point, index) in positivePoints" :key="index" class="point">
            <span class="num">{{ index + 1 }}</span>
            <span class="icon">{{ point.icon }}</span>
            <span class="text">{{ point.text }}</span>
          </div>
        </div>
      </div>

      <div class="column negative">
        <div class="column-header">👎 弊大于利</div>
        <div class="points">
          <div v-for="(point, index) in negativePoints" :key="index" class="point">
            <span class="num">{{ index + 1 }}</span>
            <span class="icon">{{ point.icon }}</span>
            <span class="text">{{ point.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useActivity } from '@/store/activity'
import { ElMessage } from 'element-plus'

const activity = useActivity()
const logsContainer = ref<HTMLElement>()

// 状态
const isSearching = ref(false)
const isLoadingPage = ref(false)
const showSummary = ref(false)
const searchProgress = ref(0)
const searchingText = ref('正在初始化搜索...')
const scrollPosition = ref(0)
const scrollProgress = ref(0)
const scrollThumbHeight = ref(20)
const scrollThumbPosition = ref(0)

// 目标URL
const targetUrl = 'https://edu.cnr.cn/sy/sytjB/20240131/t20240131_526577335.shtml'

// 日志
const searchLogs = ref<Array<{
  source: string
  content: string
  favicon: string
  url?: string
  highlight?: boolean
  isFinal?: boolean
}>>([])

// 当前阶段
const currentPhase = ref({
  icon: '🔍',
  title: '初始化搜索',
  desc: '正在连接搜索引擎...'
})

// 分析提示
const analyzingTips = ref([
  { icon: '🔍', text: '正在提取关键论点...' },
  { icon: '📊', text: '正在分析数据支撑...' },
  { icon: '💡', text: '正在总结核心观点...' }
])

// 观点数据
const positivePoints = [
  { icon: '⏰', text: '规定时间玩，能学能玩两不误' },
  { icon: '📚', text: '用电脑可以查资料，看网课学习' },
  { icon: '🎓', text: '是学习新知识的好帮手' },
  { icon: '🎨', text: '能发展画画、编程等兴趣爱好' },
  { icon: '🚀', text: '帮我们接触未来，变得更聪明' },
  { icon: '🌏', text: '开阔眼界，看到更广阔的世界' }
]

const negativePoints = [
  { icon: '⏱️', text: '平板玩得太久，耽误学习和睡觉' },
  { icon: '🎮', text: '总是想玩游戏和刷短视频' },
  { icon: '📉', text: '上课容易分心，成绩会下降' },
  { icon: '👓', text: '长时间看手机，眼睛会近视' },
  { icon: '😟', text: '可能会变得焦虑，不开心' },
  { icon: '👨‍👩‍👧', text: '和家人交流变少，容易吵架' }
]

// Favicon
const getFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=32`

// 日志数据
const searchLogsData = [
  { source: 'google.com', favicon: getFavicon('google.com'), content: '开始搜索"数字设备对学生的影响"...', phase: 1 },
  { source: 'xueshu.baidu.com', favicon: getFavicon('baidu.com'), content: '找到 127 篇相关学术论文', phase: 1 },
  { source: 'bing.com', favicon: getFavicon('bing.com'), content: '发现 3,450 条相关网页', phase: 1 },
  { source: 'scholar.google.com', favicon: getFavicon('google.com'), content: '检索到 89 项学术研究', phase: 1 },
  { source: 'cnki.net', favicon: getFavicon('cnki.net'), content: '正在分析教育类文献...', phase: 2, highlight: true },
  { source: 'who.int', favicon: getFavicon('who.int'), content: '查询儿童健康使用指南', phase: 2 },
  { source: 'oecd.org', favicon: getFavicon('oecd.org'), content: '发现 PISA 研究报告', phase: 2, highlight: true },
  { source: 'moe.gov.cn', favicon: getFavicon('moe.gov.cn'), content: '检索教育政策文件', phase: 2 },
  { source: 'pubmed.ncbi.nlm.nih.gov', favicon: getFavicon('nih.gov'), content: '搜索健康影响研究', phase: 2 },
  { source: 'unesco.org', favicon: getFavicon('unesco.org'), content: '分析数字化教育报告', phase: 3 },
  { source: 'jyb.cn', favicon: getFavicon('jyb.cn'), content: '发现权威教育评论文章', phase: 3, highlight: true },
  { source: 'nature.com', favicon: getFavicon('nature.com'), content: '查阅最新科研成果', phase: 3 },
  { source: 'sciencedirect.com', favicon: getFavicon('sciencedirect.com'), content: '分析心理发展研究', phase: 3 },
  { source: 'edu.cnr.cn', favicon: getFavicon('cnr.cn'), content: '找到高质量分析文章', phase: 4, highlight: true },
  { source: '可信度评估系统', favicon: getFavicon('cnr.cn'), content: '验证信息来源权威性...', phase: 4 },
  { source: 'AI分析引擎', favicon: getFavicon('cnr.cn'), content: '匹配度: 98.5% - 极高相关', phase: 4, highlight: true },
  { source: 'edu.cnr.cn', favicon: getFavicon('cnr.cn'), content: '已找到最佳匹配网页！', phase: 4, isFinal: true, url: targetUrl }
]

// 阶段配置
const searchPhases = [
  { icon: '🔍', title: '第一阶段：广泛搜索', desc: '正在搜索全网相关资料...' },
  { icon: '🎯', title: '第二阶段：筛选过滤', desc: '正在过滤和评估搜索结果...' },
  { icon: '📊', title: '第三阶段：深度分析', desc: '正在分析内容质量和相关性...' },
  { icon: '✨', title: '第四阶段：精准定位', desc: '正在确定最佳匹配网页...' }
]

// 开始搜索
const startSearch = async () => {
  isSearching.value = true
  isLoadingPage.value = false
  showSummary.value = false
  searchProgress.value = 0
  searchLogs.value = []

  await nextTick()
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })

  for (let i = 0; i < searchLogsData.length; i++) {
    const log = searchLogsData[i]
    
    if (log.phase <= 4) {
      currentPhase.value = searchPhases[log.phase - 1]
    }
    
    searchProgress.value = Math.round((i + 1) / searchLogsData.length * 100)
    
    if (i < 4) searchingText.value = '正在扫描搜索引擎...'
    else if (i < 9) searchingText.value = '正在筛选相关内容...'
    else if (i < 13) searchingText.value = '正在深度分析...'
    else searchingText.value = '正在定位最佳网页...'
    
    searchLogs.value.push(log)
    
    await nextTick()
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
    
    const delay = log.highlight || log.isFinal ? 250 : 80 + Math.random() * 50
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  await new Promise(resolve => setTimeout(resolve, 300))
  startPageLoading()
}

// 加载网页
const startPageLoading = async () => {
  isSearching.value = false
  isLoadingPage.value = true
  
  await nextTick()
  await autoScrollPage()
  
  isLoadingPage.value = false
  showSummary.value = true
}

// 自动滚动
const autoScrollPage = async () => {
  const totalScroll = 1200
  const scrollSteps = 30
  const stepDelay = 20
  
  for (let i = 0; i <= scrollSteps; i++) {
    scrollPosition.value = (totalScroll / scrollSteps) * i
    scrollProgress.value = (i / scrollSteps) * 100
    scrollThumbPosition.value = (i / scrollSteps) * 80
    
    if (i < scrollSteps / 3) {
      analyzingTips.value = [
        { icon: '🔍', text: '正在提取关键论点...' },
        { icon: '📖', text: '识别到教育技术相关内容' },
        { icon: '✓', text: '数据来源：OECD PISA研究' }
      ]
    } else if (i < scrollSteps * 2 / 3) {
      analyzingTips.value = [
        { icon: '📊', text: '正在分析数据支撑...' },
        { icon: '⚖️', text: '对比利弊双方论据' },
        { icon: '🎯', text: '提取核心观点中...' }
      ]
    } else {
      analyzingTips.value = [
        { icon: '💡', text: '正在总结核心观点...' },
        { icon: '✨', text: '生成智能分析报告' },
        { icon: '✅', text: '分析即将完成...' }
      ]
    }
    
    await new Promise(resolve => setTimeout(resolve, stepDelay))
  }
  
  await new Promise(resolve => setTimeout(resolve, 300))
}

// 添加到活动
const addToActivity = () => {
  const timestamp = Date.now()
  
  const resultA = {
    viewpoint: 'A' as const,
    point: positivePoints.reduce((acc, point, index) => {
      acc[index + 1] = point.text
      return acc
    }, {} as Record<number, string>),
    rating: [],
    submittedAt: timestamp
  }
  
  const resultB = {
    viewpoint: 'B' as const,
    point: negativePoints.reduce((acc, point, index) => {
      acc[index + 1] = point.text
      return acc
    }, {} as Record<number, string>),
    rating: [],
    submittedAt: timestamp + 1
  }
  
  activity.ac1_allResult['网络搜索A'] = resultA
  activity.ac1_allResult['网络搜索B'] = resultB
  
  ElMessage.success('已成功添加到观点列表！')
  
  resetSearch()
}

// 重置
const resetSearch = () => {
  isSearching.value = false
  isLoadingPage.value = false
  showSummary.value = false
  searchProgress.value = 0
  scrollPosition.value = 0
  scrollProgress.value = 0
  searchLogs.value = []
}
</script>

<style scoped>
/* 主容器 - 自适应高度 */
.search-simulator {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin: 32px 0;
  border: 2px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

/* 按钮 */
.btn-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.action-btn:hover { transform: translateY(-2px); }
.action-btn.add-btn { background: linear-gradient(135deg, #10b981, #059669); }
.btn-icon { font-size: 20px; }

/* 搜索容器 */
.search-container { min-height: 400px; }

.phase-box {
  text-align: center;
  margin-bottom: 16px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.phase-title {
  font-size: 18px;
  font-weight: 600;
  color: #0c4a6e;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.phase-desc {
  font-size: 13px;
  color: #075985;
  margin: 0;
}

/* 进度条 */
.progress-section { margin-bottom: 16px; }

.progress-bar {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s;
  border-radius: 4px;
}

.progress-text {
  font-size: 13px;
  color: #6b7280;
  text-align: center;
  font-weight: 500;
}

/* 日志 */
.logs-box {
  max-height: 350px;
  overflow-y: auto;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.logs-box::-webkit-scrollbar { width: 6px; }
.logs-box::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

.log-item {
  display: flex;
  gap: 8px;
  padding: 8px;
  margin-bottom: 6px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.log-item.highlight { background: #dbeafe; border-color: #60a5fa; }
.log-item.final { background: #fef3c7; border-color: #fbbf24; }

.log-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.log-icon img { width: 14px; height: 14px; object-fit: contain; }
.log-info { flex: 1; min-width: 0; }
.log-source { font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 2px; }
.log-text { font-size: 13px; color: #1f2937; line-height: 1.4; }
.log-url { font-size: 10px; color: #3b82f6; margin-top: 2px; word-break: break-all; }

/* 加载容器 */
.loading-container { min-height: 500px; }

.header-box {
  text-align: center;
  margin-bottom: 16px;
  padding: 16px;
  background: #ecfdf5;
  border-radius: 8px;
  border: 1px solid #6ee7b7;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #065f46;
  margin-bottom: 8px;
}

.header-url {
  font-size: 12px;
  color: #059669;
  word-break: break-all;
}

/* 浏览器 */
.browser-box {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 12px;
}

.browser-bar {
  background: #f3f4f6;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #d1d5db;
}

.browser-dots { display: flex; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }

.browser-url {
  flex: 1;
  background: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-content {
  height: 400px;
  overflow: hidden;
  position: relative;
}

.page-scroll { padding: 24px; transition: transform 0.08s linear; }

.article h1 {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.article .meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.article p {
  font-size: 14px;
  color: #333;
  margin: 0 0 16px 0;
  text-indent: 2em;
  line-height: 1.8;
  text-align: justify;
}

.article h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 20px 0 12px 0;
}

.article-info {
  font-size: 12px;
  color: #666;
  margin: 20px 0 0 0;
  padding: 12px;
  background: #f5f5f5;
  border-left: 3px solid #999;
  line-height: 1.6;
}

.scroll-bar {
  padding: 12px 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  position: relative;
}

.scroll-thumb {
  position: absolute;
  left: 16px;
  width: 160px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: all 0.08s linear;
}

/* 提示 */
.tips-box {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 12px;
  color: #1f2937;
  font-weight: 500;
}

/* 总结 */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  min-height: 400px;
}

.column {
  border-radius: 12px;
  padding: 16px;
  border: 2px solid;
}

.column.positive { background: #ecfdf5; border-color: #6ee7b7; }
.column.negative { background: #fef2f2; border-color: #fca5a5; }

.column-header {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.column.positive .column-header { color: #065f46; }
.column.negative .column-header { color: #991b1b; }

.points { display: flex; flex-direction: column; gap: 8px; }

.point {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.point .num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.point .icon { font-size: 18px; flex-shrink: 0; }
.point .text { font-size: 13px; color: #1f2937; font-weight: 500; line-height: 1.4; flex: 1; }
</style>
