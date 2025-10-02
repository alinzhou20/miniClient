import { ref } from 'vue'

/**
 * Coze AI 工具
 */

const COZE_API_URL = 'https://api.coze.cn/v1/files/upload'
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const COZE_API_TOKEN = 'sat_3NtHyM2cY3Un8anULY7pAp9bLwLMdW9sVH4CRcfZC8G378M5OrT4dS2TzeAZQ2vg'

export const WORKFLOW = {
  // 获取图片的工作流
  GET_PICTURE: '7553827536788193322',
}

export interface PictureWorkflow {
  input_img?: { file_id: string }
  input_index?: number
  [key: string]: any
}

export function useCoze() {
  const isUploading = ref(false)
  const isAnalyzing = ref(false)

  /**
   * 转换 base64 为 File 对象
   */
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

  /**
   * 上传文件获取 file_id
   */
  const uploadFile = async (dataUrl: string, filename?: string): Promise<string | null> => {
    isUploading.value = true
    
    try {
      const file = dataURLtoFile(dataUrl, filename || `coze_${Date.now()}.png`)
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(COZE_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${COZE_API_TOKEN}` },
        body: formData
      })
      
      if (!response.ok) throw new Error('文件上传失败')
      
      const result = await response.json()
      if (result.code !== 0 || !result.data?.id) throw new Error('上传响应异常')
      
      console.log('[Coze] 文件上传成功:', result.data.id)
      return result.data.id
    } catch (error) {
      console.error('[Coze] 上传失败:', error)
      return null
    } finally {
      isUploading.value = false
    }
  }

  /**
   * 运行特定工作流
   */
  const runWorkflow = async (workflowId: string, parameters: PictureWorkflow): Promise<any> => {
    isAnalyzing.value = true
    
    try {
      const response = await fetch(COZE_WORKFLOW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COZE_API_TOKEN}`
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          parameters
        })
      })

      if (!response.ok) throw new Error('工作流调用失败')

      const result = await response.json()
      if (result.code !== 0) throw new Error('工作流执行失败')

      console.log('[Coze] 工作流执行成功')
      return result.data
    } catch (error) {
      console.error('[Coze] 工作流失败:', error)
      throw error
    } finally {
      isAnalyzing.value = false
    }
  }

  return {
    isUploading,
    isAnalyzing,
    uploadFile,
    runWorkflow,
    dataURLtoFile
  }
}
