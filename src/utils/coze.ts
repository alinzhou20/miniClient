import { ref } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * Coze AI 工具
 */

const COZE_API_URL = 'https://api.coze.cn/v1/files/upload'
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const COZE_API_TOKEN = 'sat_3NtHyM2cY3Un8anULY7pAp9bLwLMdW9sVH4CRcfZC8G378M5OrT4dS2TzeAZQ2vg'

export const WORKFLOW_IDS = {
  VOTE_ANALYSIS: '7553827536788193322',
  ASK_ANALYSIS: '7554010166815899682',
  DESIGN_ANALYSIS: '7553827536788193322'
}

export function useCoze() {
  const isUploading = ref(false)
  const isAnalyzing = ref(false)

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

  const uploadImage = async (dataUrl: string, filename?: string): Promise<string | null> => {
    try {
      const file = dataURLtoFile(dataUrl, filename || `coze_${Date.now()}.jpg`)
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(COZE_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${COZE_API_TOKEN}` },
        body: formData
      })
      
      if (!response.ok) throw new Error('图片上传失败')
      
      const result = await response.json()
      if (result.code !== 0 || !result.data?.id) throw new Error('上传响应异常')
      
      return result.data.id
    } catch (error: any) {
      console.error('[Coze] 上传失败:', error)
      ElMessage.error('图片上传失败：' + error.message)
      return null
    }
  }

  const runWorkflow = async (workflowId: string, fileId: string, index: number = 0): Promise<any> => {
    try {
      const response = await fetch(COZE_WORKFLOW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COZE_API_TOKEN}`
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          parameters: { file_id: fileId, index }
        })
      })

      if (!response.ok) throw new Error('工作流调用失败')

      const result = await response.json()
      if (result.code !== 0) throw new Error(result.msg || '工作流执行失败')

      return result.data
    } catch (error: any) {
      console.error('[Coze] 工作流失败:', error)
      ElMessage.error('AI分析失败：' + error.message)
      throw error
    }
  }

  const captureAndAnalyze = async (
    dataUrl: string, 
    workflowType: keyof typeof WORKFLOW_IDS,
    index: number = 0,
    filename?: string
  ): Promise<any> => {
    isUploading.value = true
    
    try {
      const fileId = await uploadImage(dataUrl, filename)
      if (!fileId) throw new Error('图片上传失败')

      isUploading.value = false
      isAnalyzing.value = true
      
      ElMessage.success('图片上传成功！正在AI分析...')
      
      const result = await runWorkflow(WORKFLOW_IDS[workflowType], fileId, index)
      
      ElMessage.success('AI分析完成')
      return result
    } catch (error: any) {
      ElMessage.error('分析失败：' + error.message)
      throw error
    } finally {
      isUploading.value = false
      isAnalyzing.value = false
    }
  }

  return {
    isUploading,
    isAnalyzing,
    WORKFLOW_IDS,
    uploadImage,
    runWorkflow,
    captureAndAnalyze,
    dataURLtoFile
  }
}
