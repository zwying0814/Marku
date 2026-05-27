export type UserStatus = 'normal' | 'disabled'

export type CommentStatus = 'pending' | 'approved' | 'blocked'

export interface UserItem {
  id: number
  account: string
  email: string
  registeredAt: string
  status: UserStatus
  avatar?: string
  bio?: string
  location?: string
  lastLoginAt?: string
}

export interface CommentItem {
  id: number
  userId: number
  userNickname: string
  userEmail: string
  module: string
  content: string
  publishedAt: string
  status: CommentStatus
  sourceTitle?: string
}

export interface CounterItem {
  key: string
  label: string
  value: number
  unit?: string
  delta?: number
  description?: string
}