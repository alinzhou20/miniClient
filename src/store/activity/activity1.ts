import { defineStore } from 'pinia'
import { ref } from 'vue'

// 学生活动1
export const stuAc1 = defineStore('stuAc1', () => {

  // 照片数据
  const takePhoto1 = ref<string | null>(null)
  const takePhoto2 = ref<string | null>(null)

  const reset = () => {
    takePhoto1.value = null
    takePhoto2.value = null

  }
  return {
    takePhoto1,
    takePhoto2,
    reset
  }
}, {
  persist: true
})

// 状态管理
export const teaAc1 = defineStore('teaAc1', () => {

  // 学生照片数据 - 每个小组提交两张照片
  const stuPhoto = ref<Record<number, { photo1: string; photo2: string; submittedAt?: number }> | null>(null)
  
  const reset = () => {
    stuPhoto.value = null

  }
  return {
    stuPhoto,
    reset
  }
}, {
  persist: true
})