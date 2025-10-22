import { defineStore } from 'pinia'
import { ref } from 'vue'

// 学生活动2
export const stuAc2 = defineStore('stuAc2', () => {

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

// 教师活动2
export const teaAc2 = defineStore('teaAc2', () => {

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