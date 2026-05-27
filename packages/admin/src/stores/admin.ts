import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { CommentItem, CommentStatus, CounterItem, UserItem, UserStatus } from '../types'

const initialUsers: UserItem[] = [
  {
    id: 1,
    account: 'admin',
    email: 'admin@marku.local',
    registeredAt: '2026-05-01 08:12',
    status: 'normal',
    avatar: 'AD',
    bio: '系统管理员',
    location: 'Hangzhou',
    lastLoginAt: '2026-05-28 09:30',
  },
  {
    id: 2,
    account: 'alice',
    email: 'alice@example.com',
    registeredAt: '2026-05-02 13:28',
    status: 'normal',
    avatar: 'AL',
    bio: '内容审核员',
    location: 'Shanghai',
    lastLoginAt: '2026-05-28 08:50',
  },
  {
    id: 3,
    account: 'guest_9527',
    email: 'guest@example.com',
    registeredAt: '2026-05-03 21:10',
    status: 'disabled',
    avatar: 'G9',
    bio: '异常访问用户',
    location: 'Unknown',
    lastLoginAt: '2026-05-20 17:05',
  },
  {
    id: 4,
    account: 'bob',
    email: 'bob@demo.com',
    registeredAt: '2026-05-08 10:41',
    status: 'normal',
    avatar: 'BO',
    bio: '产品测试账号',
    location: 'Beijing',
    lastLoginAt: '2026-05-27 22:11',
  },
]

const initialComments: CommentItem[] = [
  {
    id: 101,
    userId: 1,
    userNickname: 'admin',
    userEmail: 'admin@marku.local',
    module: '文章详情',
    content: '这篇文章的结构很清晰，适合新用户快速上手。',
    publishedAt: '2026-05-28 09:25',
    status: 'approved',
    sourceTitle: 'Marku 入门指南',
  },
  {
    id: 102,
    userId: 2,
    userNickname: 'alice',
    userEmail: 'alice@example.com',
    module: '首页',
    content: '首页统计可以再突出一点，当前数字分布还不错。',
    publishedAt: '2026-05-28 10:10',
    status: 'pending',
    sourceTitle: '站点首页',
  },
  {
    id: 103,
    userId: 3,
    userNickname: 'guest_9527',
    userEmail: 'guest@example.com',
    module: '评论区',
    content: '测试脏数据评论，需要屏蔽。',
    publishedAt: '2026-05-27 18:00',
    status: 'blocked',
    sourceTitle: '评论测试页',
  },
  {
    id: 104,
    userId: 4,
    userNickname: 'bob',
    userEmail: 'bob@demo.com',
    module: '计数器',
    content: '统计数值更新很直观，后台可以继续补导出功能。',
    publishedAt: '2026-05-28 11:02',
    status: 'approved',
    sourceTitle: '数据概览',
  },
]

const initialCounters: CounterItem[] = [
  { key: 'views', label: '访问量', value: 128742, unit: '+', delta: 14.2, description: '近 7 天访问趋势稳定增长' },
  { key: 'reads', label: '阅读量', value: 86420, unit: '+', delta: 8.6, description: '文章页平均停留时长提升' },
  { key: 'comments', label: '评论数', value: 4821, unit: '+', delta: 5.1, description: '评论活跃度保持上升' },
  { key: 'users', label: '注册用户', value: 1398, unit: '', delta: 3.8, description: '近 30 天新增用户增长' },
]

export const useAdminStore = defineStore('admin', () => {
  const users = reactive<UserItem[]>([...initialUsers])
  const comments = reactive<CommentItem[]>([...initialComments])
  const counters = reactive<CounterItem[]>([...initialCounters])

  function toggleUserStatus(userId: number) {
    const user = users.find((item) => item.id === userId)
    if (!user) return
    user.status = user.status === 'normal' ? 'disabled' : 'normal'
  }

  function setUserStatus(userId: number, status: UserStatus) {
    const user = users.find((item) => item.id === userId)
    if (!user) return
    user.status = status
  }

  function setCommentStatus(commentId: number, status: CommentStatus) {
    const comment = comments.find((item) => item.id === commentId)
    if (!comment) return
    comment.status = status
  }

  function deleteComment(commentId: number) {
    const index = comments.findIndex((item) => item.id === commentId)
    if (index >= 0) comments.splice(index, 1)
  }

  function resetCounter(counterKey: string) {
    const counter = counters.find((item) => item.key === counterKey)
    if (!counter) return
    counter.value = 0
    counter.delta = 0
  }

  function updateCounter(counterKey: string, value: number) {
    const counter = counters.find((item) => item.key === counterKey)
    if (!counter) return
    counter.value = Math.max(0, Math.floor(value))
  }

  const dashboardTotals = computed(() => ({
    users: users.length,
    disabledUsers: users.filter((item) => item.status === 'disabled').length,
    comments: comments.length,
    pendingComments: comments.filter((item) => item.status === 'pending').length,
  }))

  return {
    users,
    comments,
    counters,
    dashboardTotals,
    toggleUserStatus,
    setUserStatus,
    setCommentStatus,
    deleteComment,
    resetCounter,
    updateCounter,
  }
})