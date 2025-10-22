import { defineStore } from 'pinia'
import { ref } from 'vue'

// 学生活动3
export const stuAc3 = defineStore('stuAc3', () => {

  // 截图数据
  const screenshot = ref<string | null>(null)

  const reset = () => {
    screenshot.value = null
  }
  
  return {
    screenshot,
    reset
  }
}, {
  persist: true
})

// 教师活动3
export const teaAc3 = defineStore('teaAc3', () => {

  // 学生截图数据
  const stuScreenshot = ref<Record<number, string> | null>(null)
  
  const reset = () => {
    stuScreenshot.value = null
  }
  
  return {
    stuScreenshot,
    reset
  }
}, {
  persist: true
})