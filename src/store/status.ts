/**
 * 全局状态管理 - 用户状态和活动状态
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { User, Activity } from '@/type'

// 活动原始数据
const activityRaw = {
  "activity1": {
    index: 1,
    title: '活动一',
    active: true,
    rating: {
      1: {
        criteria: '完成拍照并上传',
        score: 0
      },
      2: {
        criteria: '放到指定文件夹中',
        score: 0
      }
    }
  },
  "activity2": {
    index: 2,
    title: '活动二',
    active: false,
    rating: {
      1: {
        criteria: '修改代码绘制柿子的目标检测框',
        score: 0
      },
      2: {
        criteria: '裁剪出框选出来的图片',
        score: 0
      }
    }
  },
  "activity3": {
    index: 3,
    title: '活动三',
    active: false,
    rating: {
      1: {
        criteria: '成功划分数据集',
        score: 0
      }
    }
  } 
}

// 状态管理
export const useStatus = defineStore('status', () => {

  // 用户状态
  const user = ref<User | null>(null)

  // 照片数据
  const photo = ref<string | null>(null)

  // 扣子文件
  const cozeFileId = ref<string | null>(null)

  // 活动状态
  const activity = ref<Record<string, Activity> | null>(activityRaw)

  // 当前活动
  const current = ref<string | null>("activity1")
  
  const reset = () => {
    user.value = null
    photo.value = null
    cozeFileId.value = null
    activity.value = activityRaw
    current.value = "activity1"

  }
  return {
    user,
    photo,
    cozeFileId,
    activity,
    current,
    reset
  }
}, {
  persist: true
})
