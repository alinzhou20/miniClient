/**
 * 教师端数据本地存储工具
 */

const STORAGE_PREFIX = 'miniClass_teacher_'

export interface TeacherStorageData {
  // Activity1 拖拽选择数据
  activity1_selections?: Record<string, Record<string, string>>
  // Activity2 问卷数据
  activity2_surveys?: Record<string, any>
  // Activity3 问卷和设计数据
  activity3_surveys?: Record<string, any>
  activity3_designs?: Record<string, any>
  // 存储时间戳
  timestamp?: number
}

/**
 * 保存教师端数据到本地存储
 */
export function saveTeacherData(key: string, data: any): void {
  try {
    const storageKey = STORAGE_PREFIX + key
    const storageData: TeacherStorageData = {
      ...data,
      timestamp: Date.now()
    }
    localStorage.setItem(storageKey, JSON.stringify(storageData))
  } catch (error) {
    console.warn('保存本地数据失败:', error)
  }
}

/**
 * 从本地存储读取教师端数据
 */
export function loadTeacherData(key: string): TeacherStorageData | null {
  try {
    const storageKey = STORAGE_PREFIX + key
    const stored = localStorage.getItem(storageKey)
    if (!stored) return null
    return JSON.parse(stored)
  } catch (error) {
    console.warn('读取本地数据失败:', error)
    return null
  }
}

/**
 * 清除指定的教师端本地数据
 */
export function clearTeacherData(key: string): void {
  try {
    const storageKey = STORAGE_PREFIX + key
    localStorage.removeItem(storageKey)
  } catch (error) {
    console.warn('清除本地数据失败:', error)
  }
}

/**
 * Activity1 专用：保存拖拽选择数据
 */
export function saveActivity1Data(selectionData: Map<string, Map<string, string>>): void {
  const dataToSave: Record<string, Record<string, string>> = {}
  
  selectionData.forEach((studentMap, elementId) => {
    dataToSave[elementId] = {}
    studentMap.forEach((boxId, studentKey) => {
      dataToSave[elementId][studentKey] = boxId
    })
  })
  
  saveTeacherData('activity1', { activity1_selections: dataToSave })
}

/**
 * Activity1 专用：加载拖拽选择数据
 */
export function loadActivity1Data(): Map<string, Map<string, string>> | null {
  const data = loadTeacherData('activity1')
  if (!data?.activity1_selections) return null
  
  const result = new Map<string, Map<string, string>>()
  
  Object.entries(data.activity1_selections).forEach(([elementId, studentData]) => {
    const studentMap = new Map<string, string>()
    Object.entries(studentData).forEach(([studentKey, boxId]) => {
      studentMap.set(studentKey, boxId)
    })
    result.set(elementId, studentMap)
  })
  
  return result
}

/**
 * Activity2 专用：保存问卷数据
 */
export function saveActivity2Data(surveyData: Map<string, any>): void {
  const dataToSave: Record<string, any> = {}
  
  surveyData.forEach((payload, key) => {
    dataToSave[key] = payload
  })
  
  saveTeacherData('activity2', { activity2_surveys: dataToSave })
}

/**
 * Activity2 专用：加载问卷数据
 */
export function loadActivity2Data(): Map<string, any> | null {
  const data = loadTeacherData('activity2')
  if (!data?.activity2_surveys) return null
  
  const result = new Map<string, any>()
  
  Object.entries(data.activity2_surveys).forEach(([key, payload]) => {
    result.set(key, payload)
  })
  
  return result
}

/**
 * Activity3 专用：保存问卷和设计数据
 */
export function saveActivity3Data(data: { surveys: Map<string, any>; designs: Map<string, any> }): void {
  const surveysToSave: Record<string, any> = {}
  const designsToSave: Record<string, any> = {}
  
  data.surveys.forEach((payload, key) => {
    surveysToSave[key] = payload
  })
  
  data.designs.forEach((payload, key) => {
    designsToSave[key] = payload
  })
  
  saveTeacherData('activity3', { 
    activity3_surveys: surveysToSave,
    activity3_designs: designsToSave
  })
}

/**
 * Activity3 专用：加载问卷和设计数据
 */
export function loadActivity3Data(): { surveys: Map<string, any>; designs: Map<string, any> } | null {
  const data = loadTeacherData('activity3')
  if (!data?.activity3_surveys && !data?.activity3_designs) return null
  
  const surveys = new Map<string, any>()
  const designs = new Map<string, any>()
  
  if (data.activity3_surveys) {
    Object.entries(data.activity3_surveys).forEach(([key, payload]) => {
      surveys.set(key, payload)
    })
  }
  
  if (data.activity3_designs) {
    Object.entries(data.activity3_designs).forEach(([key, payload]) => {
      designs.set(key, payload)
    })
  }
  
  return { surveys, designs }
}
