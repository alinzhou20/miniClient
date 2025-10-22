// 用户
export interface User {
  type: 'student' | 'teacher'
  groupNo?: string
  studentNo?: string
  studentRole?: string
}

// 活动
export interface Activity {
  index: number,
  title: string,
  active: boolean
  rating: Record<number, Rating>
}

// 评价
export interface Rating {
  criteria: string
  score: number
}