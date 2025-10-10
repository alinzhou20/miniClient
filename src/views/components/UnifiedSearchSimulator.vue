<template>
  <div class="unified-search-simulator">
    <!-- 标题区域 -->
    <div class="search-header" v-if="!isSearching && !isLoadingPage && !showSummary">
      <h3 class="search-title">
        <span class="icon">🔍</span>
        智能搜索分析系统
      </h3>
      <p class="search-subtitle">基于全网数据的深度分析与网页验证</p>
    </div>

    <!-- 搜索按钮区域 -->
    <div class="search-buttons" v-if="!isSearching && !isLoadingPage && !showSummary">
      <button 
        class="search-btn btn-primary"
        @click="startSearch('both')"
      >
        <span class="btn-icon">🔍</span>
        <span class="btn-text">开始智能搜索分析</span>
      </button>
    </div>

    <!-- 搜索进行中 -->
    <div v-if="isSearching" class="searching-container">
      <!-- 当前搜索阶段 -->
      <div class="search-phase">
        <h4 class="phase-title">
          <span class="phase-icon">{{ currentPhase.icon }}</span>
          {{ currentPhase.title }}
        </h4>
        <p class="phase-desc">{{ currentPhase.desc }}</p>
      </div>

      <!-- 搜索进度条 -->
      <div class="search-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: searchProgress + '%' }"></div>
        </div>
        <div class="progress-text">{{ searchProgress }}% - {{ searchingText }}</div>
      </div>

      <!-- 实时搜索日志 -->
      <div class="search-logs" ref="logsContainer">
        <div 
          v-for="(log, index) in searchLogs" 
          :key="index"
          class="log-item"
          :class="{ 
            'log-highlight': log.highlight,
            'log-final': log.isFinal
          }"
        >
          <div class="log-favicon">
            <img :src="log.favicon" :alt="log.source" class="favicon-icon" />
          </div>
          <div class="log-details">
            <div class="log-source">{{ log.source }}</div>
            <div class="log-content">{{ log.content }}</div>
            <div class="log-url" v-if="log.url">{{ log.url }}</div>
          </div>
        </div>
      </div>

      <!-- 搜索统计 - 已隐藏 -->
    </div>

    <!-- 网页加载阶段 -->
    <div v-if="isLoadingPage" class="page-loading-container">
      <div class="loading-header">
        <h4 class="loading-title">
          <span class="icon">🎯</span>
          已找到最佳匹配网页
        </h4>
        <p class="loading-url">{{ targetUrl }}</p>
      </div>

      <!-- 模拟网页预览 -->
      <div class="page-preview" ref="pagePreview">
        <div class="page-browser">
          <div class="browser-bar">
            <div class="browser-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="browser-url">
              <span class="lock-icon">🔒</span>
              <span class="url-text">{{ targetUrl }}</span>
            </div>
          </div>
          
          <div class="browser-content" ref="browserContent">
            <div class="page-content" :style="{ transform: `translateY(-${scrollPosition}px)` }">
              <!-- 网页标题 -->
              <div class="article-header">
                <h1 class="article-title">明确数字技术资源 有效促进学习发展</h1>
                <div class="article-meta">
                  <span class="meta-item">📅 2024-01-31</span>
                  <span class="meta-item">📰 中国教育报</span>
                </div>
              </div>

              <!-- 网页内容 -->
              <div class="article-body">
                <p class="article-paragraph">
                  随着数字化技术的发展，席卷全球经济的数字技术正深刻改变着教育形态。在线学习平台、教育应用程序等数字技术工具为学生学习提供了前所未有的可能。经济合作与发展组织（OECD）发布的国际学生评估项目（PISA）为我们理解数字技术对学校教育的影响提供了独特视角。
                </p>
                
                <p class="article-paragraph">
                  PISA汇集全球80个国家和地区21629所学校、613744名学生的数据，详细记录了数字技术在过去二十年间对学生学习生活的改变。数据显示，数字技术能够为学生学习赋能，但前提是正确获取、装配和使用设备。教师是否能有效引导学生进行数字技术的批判性和创造性使用，学生是否具备必要的数字技能和信息素养都是关键因素。
                </p>

                <h3 class="section-title">数字设备使用频率超过每天1小时，学生学业表现呈现下降态势</h3>
                
                <p class="article-paragraph">
                  PISA证据表明，数字技术的可见性和即时性并不能保证高质量的学习。数字技术能够为学生的学习赋能，但前提是要能够正确获取、装配和使用这些数字资源。研究发现，学生若将手机等数字设备主要用于课外娱乐，课外数字设备使用频率超过每天1小时的临界值时，学生学业表现会呈现下降态势。
                </p>

                <p class="article-paragraph">
                  其中一个原因是，过度使用数字设备可能会导致信息过载、注意力分散等问题，且挤占了原本应该用于阅读、睡眠等其他活动的时间，从而对学生身心的健康和学业发展带来负面影响。
                </p>

                <p class="article-paragraph">
                  因此，在课外环境中给予更多的机制约束来使用数字设备，对数字技术发展对学生的影响却是更为稳健。虽然数字技术在教学中的应用与学生学习成绩之间存在微弱甚至负向的相关性，但这并不意味着教师和学校应该放弃使用数字技术教学。
                </p>

                <h3 class="section-title">学生是否具备规定和执行数字技术使用规则的能力是关键</h3>

                <p class="article-paragraph">
                  PISA数据显示，若学生在任何时候都能够轻松接触和使用诸如手机等数字移动设备的情况下，越来越多的未成年人将缺乏自主思考和自我管理的能力。为了防止数字技术带来的负面效应，多个国家和地区禁止中小学生携带手机上课，或限定规则允许儿童接触某些电子游戏和视频内容。
                </p>

                <p class="article-paragraph">
                  禁止在校内携带手机上课时，学生在课堂上使用手机机会受到限制，注意力更集中，学习效果也相应提高。但也有研究显示，在禁止学生携带手机上课却未能显著改善学生学习成绩的案例。一种可能的解释是，禁令未能得到有效执行；另一种可能的解释是教师们未能及时观察到学生在课堂上使用数字设备实施的到底是什么行为，以使这些数字设备成为课程的一部分。
                </p>

                <p class="article-paragraph">
                  PISA数据进一步显示，当学生和教师共同制定了在课堂上使用数字设备的制度规范时，一般情况下，这些学生的阅读、数学和科学成绩都会更高。可见，数字技术的使用能够有效地促进学生的学习，而关键在于师生是否共同制定和执行数字技术的使用规则。
                </p>

                <h3 class="section-title">让数字技术成为学习工具，需把手机还给学生</h3>

                <p class="article-paragraph">
                  PISA2022数据显示，当学生对数字技术持有积极态度，并支持学科教学时，他们对阅读、数学和科学学科的学习兴趣都会更强烈；相反，当学生只知道自己的行为被数字技术所监控，或被要求通过数字技术完成学习任务时，学生的阅读、数学和科学成绩会更低。由此可见，即使在课内和家庭及学校影响减弱的情况下，学生依然能够有效学习。
                </p>

                <p class="article-paragraph">
                  可见，有效学习的始终都在等待着那些具备"主动"精神且能够独立自主地进行探索和发现的个体。如何在浩如烟海的信息海洋中不迷失方向、不随波逐流，需要学生掌握批判性思维和问题解决能力。数字技术为学生提供了跨越时空限制的"无边界"学习机会，但这也要求学生学会使用新技术进行适应性学习，而教师和教科书已无法及时提供这些新知识和新技能。因此，有必要转变态度，将手机还给学生。
                </p>

                <p class="article-paragraph">
                  数字技术要实现为学生学习赋能的根本目标，不仅需要将数字技术与学生的使用数字技术联系起来，更需要与适应性学习和探索性学习联系起来。PISA调查数据表明，当教师明确支持学生使用数字技术进行探索式学习时，学生通过思考、沟通、协同合作等形式在真实的问题情境中解决问题，能够促进探索性和反思性行为的产生。
                </p>

                <p class="article-paragraph">
                  探索式学习虽然允许学生频繁使用数字设备，但由于需要注意力集中，学生可以避免信息过载的问题。教师与学生共同使用数字设备来提高教学有效性，对于促进探索式学习与探究式学习的"路径转换"也是必要的。这一方面要求教师的角色从传统的知识传播者转变为学习的引导者，且具备数字技术的教学法技能，以及带领学生建立思维工具的能力。另一方面，数字技术还能够将教学中的问题呈现和学生的特点，提供更加个性化或适应性的教学方式，使每位学生成为积极主动的探索者。建立一个融合数字技术的适应性和探究性学习生态系统，是实现有效学习的必由之路。
                </p>

                <p class="article-info">
                  （作者：刘莉莉、鄢婷婷，系重庆师范大学教育科学学院副教授；本文系重庆市社科规划培育项目成果）
                </p>
              </div>
            </div>
          </div>

          <!-- 滚动进度指示 -->
          <div class="scroll-indicator">
            <div class="scroll-bar">
              <div class="scroll-thumb" :style="{ height: scrollThumbHeight + '%', top: scrollThumbPosition + '%' }"></div>
            </div>
            <div class="scroll-text">正在阅读分析... {{ Math.round(scrollProgress) }}%</div>
          </div>
        </div>
      </div>

      <!-- 分析中提示 -->
      <div class="analyzing-tips">
        <div class="tip-item" v-for="(tip, index) in analyzingTips" :key="index">
          <span class="tip-icon">{{ tip.icon }}</span>
          <span class="tip-text">{{ tip.text }}</span>
        </div>
      </div>
    </div>

    <!-- 最终总结 -->
    <div v-if="showSummary" class="summary-container">
      <div class="summary-header">
        <h3 class="summary-title">
          <span class="icon">📊</span>
          智能分析总结
        </h3>
        <p class="summary-source">
          基于 <strong>{{ targetUrl }}</strong> 的深度分析
        </p>
      </div>

      <!-- 双栏观点展示 -->
      <div class="viewpoints-grid">
        <!-- 利大于弊 -->
        <div class="viewpoint-column positive-viewpoint">
          <div class="viewpoint-header">
            <h4 class="viewpoint-title">
              <span class="title-icon">👍</span>
              利大于弊
            </h4>
          </div>
          <div class="viewpoint-list">
            <div 
              v-for="(point, index) in positivePoints" 
              :key="index"
              class="viewpoint-item"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <span class="point-number">{{ index + 1 }}</span>
              <div class="point-content">
                <span class="point-icon">{{ point.icon }}</span>
                <span class="point-text">{{ point.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 弊大于利 -->
        <div class="viewpoint-column negative-viewpoint">
          <div class="viewpoint-header">
            <h4 class="viewpoint-title">
              <span class="title-icon">👎</span>
              弊大于利
            </h4>
          </div>
          <div class="viewpoint-list">
            <div 
              v-for="(point, index) in negativePoints" 
              :key="index"
              class="viewpoint-item"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <span class="point-number">{{ index + 1 }}</span>
              <div class="point-content">
                <span class="point-icon">{{ point.icon }}</span>
                <span class="point-text">{{ point.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="summary-actions">
        <button class="action-btn primary-btn" @click="addToActivity">
          <span class="btn-icon">➕</span>
          添加到观点列表
        </button>
        <button class="action-btn secondary-btn" @click="resetSearch">
          <span class="btn-icon">🔄</span>
          重新搜索
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useActivity } from '@/store/activity'
import { ElMessage } from 'element-plus'

const activity = useActivity()

// 搜索状态
const isSearching = ref(false)
const isLoadingPage = ref(false)
const showSummary = ref(false)
const searchType = ref<'positive' | 'negative'>('positive')
const searchProgress = ref(0)
const searchingText = ref('正在初始化搜索...')

// 网页滚动状态
const scrollPosition = ref(0)
const scrollProgress = ref(0)
const scrollThumbHeight = ref(20)
const scrollThumbPosition = ref(0)

// 统计数据
const websitesScanned = ref(0)
const pagesAnalyzed = ref(0)
const relevantResults = ref(0)

// DOM引用
const logsContainer = ref<HTMLElement>()
const pagePreview = ref<HTMLElement>()
const browserContent = ref<HTMLElement>()

// 目标网页URL
const targetUrl = 'https://edu.cnr.cn/sy/sytjB/20240131/t20240131_526577335.shtml'

// 搜索日志
const searchLogs = ref<Array<{
  source: string
  content: string
  favicon: string
  url?: string
  highlight?: boolean
  isFinal?: boolean
}>>([])

// 当前搜索阶段
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

// Favicon 生成函数
const getFavicon = (domain: string) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
}

// 最终观点
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

// 搜索日志数据 - 模拟搜索多个网站
const searchLogsData = [
  // 第一阶段：广泛搜索
  { source: 'google.com', favicon: getFavicon('google.com'), content: '开始搜索"数字设备对学生的影响"...', phase: 1 },
  { source: 'xueshu.baidu.com', favicon: getFavicon('baidu.com'), content: '找到 127 篇相关学术论文', phase: 1 },
  { source: 'bing.com', favicon: getFavicon('bing.com'), content: '发现 3,450 条相关网页', phase: 1 },
  { source: 'scholar.google.com', favicon: getFavicon('google.com'), content: '检索到 89 项学术研究', phase: 1 },
  
  // 第二阶段：筛选过滤
  { source: 'cnki.net', favicon: getFavicon('cnki.net'), content: '正在分析教育类文献...', phase: 2, highlight: true },
  { source: 'who.int', favicon: getFavicon('who.int'), content: '查询儿童健康使用指南', phase: 2 },
  { source: 'oecd.org', favicon: getFavicon('oecd.org'), content: '发现 PISA 研究报告', phase: 2, highlight: true },
  { source: 'moe.gov.cn', favicon: getFavicon('moe.gov.cn'), content: '检索教育政策文件', phase: 2 },
  { source: 'pubmed.ncbi.nlm.nih.gov', favicon: getFavicon('nih.gov'), content: '搜索健康影响研究', phase: 2 },
  
  // 第三阶段：深度分析
  { source: 'unesco.org', favicon: getFavicon('unesco.org'), content: '分析数字化教育报告', phase: 3 },
  { source: 'jyb.cn', favicon: getFavicon('jyb.cn'), content: '发现权威教育评论文章', phase: 3, highlight: true },
  { source: 'nature.com', favicon: getFavicon('nature.com'), content: '查阅最新科研成果', phase: 3 },
  { source: 'sciencedirect.com', favicon: getFavicon('sciencedirect.com'), content: '分析心理发展研究', phase: 3 },
  
  // 第四阶段：精准定位
  { source: 'edu.cnr.cn', favicon: getFavicon('cnr.cn'), content: '找到高质量分析文章', phase: 4, highlight: true },
  { source: '可信度评估系统', favicon: getFavicon('cnr.cn'), content: '验证信息来源权威性...', phase: 4 },
  { source: 'AI分析引擎', favicon: getFavicon('cnr.cn'), content: '匹配度: 98.5% - 极高相关', phase: 4, highlight: true },
  { source: 'edu.cnr.cn', favicon: getFavicon('cnr.cn'), content: '已找到最佳匹配网页！', phase: 4, isFinal: true, url: targetUrl }
]

// 搜索阶段配置
const searchPhases = [
  { icon: '🔍', title: '第一阶段：广泛搜索', desc: '正在搜索全网相关资料...' },
  { icon: '🎯', title: '第二阶段：筛选过滤', desc: '正在过滤和评估搜索结果...' },
  { icon: '📊', title: '第三阶段：深度分析', desc: '正在分析内容质量和相关性...' },
  { icon: '✨', title: '第四阶段：精准定位', desc: '正在确定最佳匹配网页...' }
]

// 开始搜索
const startSearch = async (type: 'positive' | 'negative' | 'both') => {
  searchType.value = type === 'both' ? 'positive' : type
  isSearching.value = true
  isLoadingPage.value = false
  showSummary.value = false
  searchProgress.value = 0
  searchLogs.value = []
  websitesScanned.value = 0
  pagesAnalyzed.value = 0
  relevantResults.value = 0

  // 模拟搜索过程
  for (let i = 0; i < searchLogsData.length; i++) {
    const log = searchLogsData[i]
    
    // 更新当前阶段
    if (log.phase <= 4) {
      currentPhase.value = searchPhases[log.phase - 1]
    }
    
    // 更新进度
    searchProgress.value = Math.round((i + 1) / searchLogsData.length * 100)
    
    // 更新搜索文本
    if (i < 4) searchingText.value = '正在扫描搜索引擎...'
    else if (i < 9) searchingText.value = '正在筛选相关内容...'
    else if (i < 13) searchingText.value = '正在深度分析...'
    else searchingText.value = '正在定位最佳网页...'
    
    // 添加日志
    searchLogs.value.push(log)
    
    // 自动滚动
    await nextTick()
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
    
    // 延迟 - 进一步加快速度
    const delay = log.highlight || log.isFinal ? 250 : 80 + Math.random() * 50
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  // 搜索完成，开始加载网页
  await new Promise(resolve => setTimeout(resolve, 300))
  startPageLoading()
}

// 开始加载网页
const startPageLoading = async () => {
  isSearching.value = false
  isLoadingPage.value = true
  
  // 等待页面渲染
  await nextTick()
  
  // 模拟自动滚动阅读
  await autoScrollPage()
  
  // 显示总结
  isLoadingPage.value = false
  showSummary.value = true
}

// 自动滚动网页
const autoScrollPage = async () => {
  const totalScroll = 1200 // 总滚动距离
  const scrollSteps = 30 // 滚动步数 - 进一步减少步数
  const stepDelay = 20 // 每步延迟 - 进一步减少延迟
  
  for (let i = 0; i <= scrollSteps; i++) {
    scrollPosition.value = (totalScroll / scrollSteps) * i
    scrollProgress.value = (i / scrollSteps) * 100
    scrollThumbPosition.value = (i / scrollSteps) * 80 // 滚动条位置
    
    // 更新分析提示
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
  
  // 滚动完成后稍作停留
  await new Promise(resolve => setTimeout(resolve, 300))
}

// 添加到活动
const addToActivity = () => {
  const timestamp = Date.now()
  
  // 观点A（利大于弊）
  const resultA = {
    viewpoint: 'A' as const,
    point: positivePoints.reduce((acc, point, index) => {
      acc[index + 1] = point.text
      return acc
    }, {} as Record<number, string>),
    rating: [],
    submittedAt: timestamp
  }
  
  // 观点B（弊大于利）
  const resultB = {
    viewpoint: 'B' as const,
    point: negativePoints.reduce((acc, point, index) => {
      acc[index + 1] = point.text
      return acc
    }, {} as Record<number, string>),
    rating: [],
    submittedAt: timestamp + 1
  }
  
  // 添加到 store
  activity.ac1_allResult['网络搜索A'] = resultA
  activity.ac1_allResult['网络搜索B'] = resultB
  
  ElMessage.success('已成功添加到观点列表！')
  
  // 2秒后重置
  setTimeout(() => {
    resetSearch()
  }, 2000)
}

// 重置搜索
const resetSearch = () => {
  isSearching.value = false
  isLoadingPage.value = false
  showSummary.value = false
  searchProgress.value = 0
  scrollPosition.value = 0
  scrollProgress.value = 0
  searchLogs.value = []
  websitesScanned.value = 0
  pagesAnalyzed.value = 0
  relevantResults.value = 0
}
</script>

<style scoped>
.unified-search-simulator {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  margin: 32px 0;
  border: 2px solid #f3f4f6;
}

/* 标题区域 */
.search-header {
  text-align: center;
  margin-bottom: 32px;
}

.search-title {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.search-title .icon {
  font-size: 36px;
}

.search-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 12px 0 0 0;
}

/* 搜索按钮 */
.search-buttons {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 32px;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 40px;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
}

.btn-icon {
  font-size: 24px;
}

/* 搜索阶段 */
.search-phase {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 12px;
  border: 2px solid #bae6fd;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.phase-title {
  font-size: 20px;
  font-weight: 700;
  color: #0c4a6e;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.phase-icon {
  font-size: 28px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.phase-desc {
  font-size: 14px;
  color: #075985;
  margin: 0;
}

/* 进度条 */
.search-progress {
  margin-bottom: 24px;
}

.progress-bar {
  height: 10px;
  background: #f3f4f6;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
  transition: width 0.3s ease;
  border-radius: 5px;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.progress-text {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  font-weight: 600;
}

/* 搜索日志 */
.search-logs {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  height: 350px;
  overflow-y: auto;
  margin-bottom: 24px;
}

.search-logs::-webkit-scrollbar {
  width: 8px;
}

.search-logs::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.search-logs::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  animation: slideIn 0.3s ease;
  transition: all 0.2s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.log-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.log-item.log-highlight {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #60a5fa;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.log-item.log-final {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fbbf24;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  animation: finalPulse 0.5s ease;
}

@keyframes finalPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.log-favicon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.favicon-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.log-details {
  flex: 1;
  min-width: 0;
}

.log-source {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 2px;
  letter-spacing: 0.3px;
}

.log-content {
  font-size: 13px;
  color: #1f2937;
  line-height: 1.5;
  font-weight: 400;
}

.log-url {
  font-size: 11px;
  color: #3b82f6;
  margin-top: 2px;
  word-break: break-all;
}

/* 搜索统计 */
.search-stats {
  display: flex;
  justify-content: center;
  gap: 60px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  animation: countUp 0.3s ease;
}

@keyframes countUp {
  from { transform: scale(1.3); color: #3b82f6; }
  to { transform: scale(1); color: #1f2937; }
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 600;
}

/* 网页加载容器 */
.page-loading-container {
  animation: fadeIn 0.5s ease;
}

.loading-header {
  text-align: center;
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-radius: 12px;
  border: 2px solid #6ee7b7;
}

.loading-title {
  font-size: 24px;
  font-weight: 700;
  color: #065f46;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loading-url {
  font-size: 14px;
  color: #059669;
  margin: 0;
  word-break: break-all;
  font-weight: 600;
}

/* 网页预览 */
.page-preview {
  margin-bottom: 24px;
}

.page-browser {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.browser-bar {
  background: #f3f4f6;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #d1d5db;
}

.browser-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }

.browser-url {
  flex: 1;
  background: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lock-icon {
  font-size: 14px;
}

.url-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-content {
  height: 500px;
  overflow: hidden;
  background: white;
  position: relative;
}

.page-content {
  padding: 40px;
  transition: transform 0.08s linear;
}

.article-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 3px solid #e5e7eb;
}

.article-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #6b7280;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.article-body {
  line-height: 2;
  color: #333;
}

.article-paragraph {
  font-size: 16px;
  color: #333;
  margin: 0 0 20px 0;
  text-indent: 2em;
  line-height: 2;
  text-align: justify;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 28px 0 16px 0;
  line-height: 1.5;
}

.article-info {
  font-size: 14px;
  color: #666;
  margin: 32px 0 0 0;
  padding: 16px;
  background: #f5f5f5;
  border-left: 3px solid #999;
  line-height: 1.8;
}

/* 滚动指示器 */
.scroll-indicator {
  padding: 16px 20px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
}

.scroll-bar {
  width: 200px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.scroll-thumb {
  position: absolute;
  left: 0;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: all 0.08s linear;
}

.scroll-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 600;
}

/* 分析提示 */
.analyzing-tips {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: tipPulse 2s infinite;
}

@keyframes tipPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.tip-icon {
  font-size: 20px;
}

.tip-text {
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
}

/* 总结容器 */
.summary-container {
  animation: fadeIn 0.6s ease;
}

.summary-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 28px;
  background: linear-gradient(135deg, #ede9fe, #ddd6fe);
  border-radius: 16px;
  border: 2px solid #c4b5fd;
}

.summary-title {
  font-size: 28px;
  font-weight: 700;
  color: #5b21b6;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.summary-source {
  font-size: 14px;
  color: #6d28d9;
  margin: 0;
  word-break: break-all;
}

.summary-source strong {
  color: #5b21b6;
  font-weight: 700;
}

/* 观点网格 */
.viewpoints-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

.viewpoint-column {
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.positive-viewpoint {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border: 2px solid #6ee7b7;
}

.negative-viewpoint {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 2px solid #fca5a5;
}

.viewpoint-header {
  margin-bottom: 20px;
  text-align: center;
}

.viewpoint-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.positive-viewpoint .viewpoint-title {
  color: #065f46;
}

.negative-viewpoint .viewpoint-title {
  color: #991b1b;
}

.title-icon {
  font-size: 28px;
}

.viewpoint-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.viewpoint-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: slideUp 0.5s ease backwards;
  transition: all 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.viewpoint-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.point-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
}

.point-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.point-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.point-text {
  font-size: 15px;
  color: #1f2937;
  font-weight: 500;
  line-height: 1.6;
}

/* 操作按钮 */
.summary-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 36px;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.primary-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.primary-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
}

.secondary-btn {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  color: white;
}

.secondary-btn:hover {
  background: linear-gradient(135deg, #4b5563, #374151);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .viewpoints-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .unified-search-simulator {
    padding: 24px 16px;
  }

  .search-buttons {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
    justify-content: center;
  }

  .search-stats {
    gap: 24px;
  }

  .analyzing-tips {
    flex-direction: column;
    gap: 12px;
  }

  .summary-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

