/**
 * 全局状态管理 - 用户状态和活动状态
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/type'

// 活动配置（静态数据，不会改变）
export const ACTIVITY_CONFIG = [
  {
    index: 1,
    name: 'activity1',
    title: '活动一',
    max: 2,
    criteria: [
      { id: 1, text: '1. 给生柿子、熟柿子各拍一张照片。' , max: 1},
      { id: 2, text: '2. 能将生柿子、熟柿子照片进行裁剪放到指定文件夹中。' , max: 1}
    ]
  },
  {
    index: 2,
    name: 'activity2',
    title: '活动二',
    max: 5,
    criteria: [
      { id: 1, text: '3. 能利用代码得到图片中RGB通道数值。' , max: 3},
      { id: 2, text: '4. 能理解“R”通道与“G”通道数值代表的含义。' , max: 2}
    ]
  },
  {
    index: 3,
    name: 'activity3',
    title: '活动三',
    max: 3,
    criteria: [
      { id: 1, text: '5. 能运行代码，将图片数据集进行划分。', max: 1 },
      { id: 2, text: '6. 观察划分后的变化，能说出数据集划分的规律。', max: 1 },
    ]
  }
 ] as const

// 评分初始化工厂函数
const createActivityScores = () => ({
  activity1: { 1: 0, 2: 0 },  // 1:拍摄2张照片, 2:分类标注
  activity2: { 1: 0, 2: 0 },  // 1:RGB通道数值(3分), 2:通道含义理解(2分)
  activity3: { 1: 0, 2: 0 }   // 1:数据集划分(1分), 2:划分规律(1分)
})

// 状态管理
export const useStuStatus = defineStore('stuStatus', () => {

  // 用户状态
  const user = ref<User | null>(null)

  // 照片数据
  const photo = ref<string | null>(null)

  // 扣子文件
  const cozeFileId = ref<string | null>(null)

  // 评分数据（扁平化存储，只存储分数）
  const scores = createActivityScores()
  const activity1Score = ref(scores.activity1)
  const activity2Score = ref(scores.activity2)
  const activity3Score = ref(scores.activity3)

  // 当前活动
  const current = ref<string | null>("activity1")
  
  const reset = () => {
    user.value = null
    photo.value = null
    cozeFileId.value = null
    // 重置评分（创建新对象避免引用）
    const newScores = createActivityScores()
    activity1Score.value = newScores.activity1
    activity2Score.value = newScores.activity2
    activity3Score.value = newScores.activity3
    current.value = "activity1"
  }

  // 注意：不再使用 watch 自动发送评分消息
  // 原因：persist 插件会在 state 变化时同步写入 localStorage，
  // 这会阻塞主线程导致 Socket 心跳包超时，从而断开连接
  // 解决方案：在需要发送评分的地方直接调用 socket.emit

  return {
    user,
    photo,
    cozeFileId,
    activity1Score,  // 活动1评分
    activity2Score,  // 活动2评分
    activity3Score,  // 活动3评分
    current,
    reset
  }
}, {
  persist: true
})

// 学生数据初始化工厂函数
const createStudents = () => {
  const students: Record<string, {
    login: boolean;        // 是否登录
    studentNo: string;     // 学生编号
    activity1: number;     // 活动1总分
    activity1_1: number;   // 活动1-1分
    activity1_2: number;   // 活动1-2分
    picture1_1: string;    // 活动1-1图片
    picture1_2: string;    // 活动1-2图片
    activity2: number;     // 活动2总分
    activity2_1: number;   // 活动2-1分
    activity2_2: number;   // 活动2-2分
    picture2_1: string;    // 活动2-1图片
    picture2_2: string;    // 活动2-2图片
    activity3: number;     // 活动3总分
    activity3_1: number;   // 活动3-1分
    picture3_1: string;    // 活动3-1图片
    picture3_2: string;    // 活动3-2图片
  }> = {}

  // 生成21个学生数据
  for (let i = 1; i <= 21; i++) {
    const studentNo = i.toString()
    students[studentNo] = {
      login: false,
      studentNo,
      activity1: 0,
      activity1_1: 0,
      activity1_2: 0,
      picture1_1: '',
      picture1_2: '',
      activity2: 0,
      activity2_1: 0,
      activity2_2: 0,
      picture2_1: '',
      picture2_2: '',
      activity3: 0,
      activity3_1: 0,
      picture3_1: '',
      picture3_2: '',
    }
  }

  return students
}

// 教师状态管理
export const useTeaStatus = defineStore('teaStatus', () => {

  // 用户状态
  const user = ref<User | null>(null)

  // 当前活动
  const current = ref<string | null>("activity1")

  // 学生数据
  const students = ref(createStudents())
  
  const reset = () => {
    user.value = null
    students.value = createStudents()
    current.value = "activity1"
  }
  
  return {
    user,
    students,
    current,
    reset
  }
}, {
  persist: true
})
