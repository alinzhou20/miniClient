import { defineStore } from 'pinia'
import { ref } from 'vue'

// 学生活动1
export const useStuAc1 = defineStore('stuAc1', () => {

  // 照片数据
  const takePhoto1 = ref<string | null>(null)
  const takePhoto2 = ref<string | null>(null)

  // 识别结果
  const photo1 = ref<{ fileId: string; my: string; re: string } | null>(null)
  const photo2 = ref<{ fileId: string; my: string; re: string } | null>(null)

  const reset = () => {
    takePhoto1.value = null
    takePhoto2.value = null
    photo1.value = null
    photo2.value = null
  }
  return {
    takePhoto1,
    takePhoto2,
    photo1,
    photo2,
    reset
  }
}, {
  // 禁用持久化：照片数据太大（300KB×2），写入 localStorage 会阻塞主线程导致 Socket 断连
  persist: false
})

// 状态管理
export const useTeaAc1 = defineStore('teaAc1', () => {

  // 学生照片数据 - 每个小组提交两张照片
  const stuPhoto = ref<Record<number, { 
    photo1: string; 
    photo2: string; 
    label1?: string;
    label2?: string;
    submittedAt?: number 
  }> | null>(null)
  
  const reset = () => {
    stuPhoto.value = null

  }
  return {
    stuPhoto,
    reset
  }
}, {
  // 禁用持久化：stuPhoto 包含所有学生的照片（可能 24组×2张×300KB = 14MB+）
  // 写入 localStorage 会严重阻塞主线程，导致 Socket 断连和页面卡顿
  persist: false
})