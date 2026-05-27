<script setup lang="ts">
import { computed, ref } from 'vue'
import SectionCard from '../components/SectionCard.vue'
import StatusPill from '../components/StatusPill.vue'
import TablePager from '../components/TablePager.vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()
const query = ref('')
const page = ref(1)
const pageSize = 5
const selectedCommentId = ref<number | null>(store.comments[0]?.id ?? null)

const filteredComments = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return store.comments
  return store.comments.filter((comment) => [comment.userNickname, comment.userEmail, comment.module, comment.content, comment.sourceTitle].filter(Boolean).join(' ').toLowerCase().includes(keyword))
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredComments.value.length / pageSize)))

const visibleComments = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredComments.value.slice(start, start + pageSize)
})

const selectedComment = computed(() => store.comments.find((item) => item.id === selectedCommentId.value) ?? null)

function setPage(nextPage: number) {
  page.value = Math.min(Math.max(nextPage, 1), pageCount.value)
}

function onSearch() {
  page.value = 1
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[1.5fr_0.5fr]">
    <SectionCard title="评论管理" description="展示 ID、昵称、内容、所属模块、发布时间、审核状态，支持搜索、分页和审核操作">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input v-model="query" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300" placeholder="搜索昵称 / 模块 / 内容 / 邮箱" @input="onSearch" />
        <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">共 {{ filteredComments.length }} 条评论</div>
      </div>

      <div class="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="px-4 py-3 font-medium">ID</th>
              <th class="px-4 py-3 font-medium">用户昵称</th>
              <th class="px-4 py-3 font-medium">评论内容</th>
              <th class="px-4 py-3 font-medium">所属模块</th>
              <th class="px-4 py-3 font-medium">发布时间</th>
              <th class="px-4 py-3 font-medium">审核状态</th>
              <th class="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-for="comment in visibleComments" :key="comment.id" class="transition hover:bg-slate-50">
              <td class="px-4 py-4 text-slate-600">{{ comment.id }}</td>
              <td class="px-4 py-4">
                <button class="font-medium text-slate-900 transition hover:text-blue-600" @click="selectedCommentId = comment.id">{{ comment.userNickname }}</button>
                <p class="mt-1 text-xs text-slate-500">{{ comment.userEmail }}</p>
              </td>
              <td class="px-4 py-4 text-slate-600">
                <p class="line-clamp-2 max-w-[360px]">{{ comment.content }}</p>
              </td>
              <td class="px-4 py-4 text-slate-600">{{ comment.module }}</td>
              <td class="px-4 py-4 text-slate-600">{{ comment.publishedAt }}</td>
              <td class="px-4 py-4"><StatusPill :value="comment.status" /></td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-2">
                  <button class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50" @click="selectedCommentId = comment.id">查看用户</button>
                  <button class="rounded-xl bg-emerald-200 px-3 py-2 text-xs text-slate-900 transition hover:bg-emerald-100" @click="store.setCommentStatus(comment.id, 'approved')">通过</button>
                  <button class="rounded-xl bg-amber-200 px-3 py-2 text-xs text-slate-900 transition hover:bg-amber-100" @click="store.setCommentStatus(comment.id, 'blocked')">屏蔽</button>
                  <button class="rounded-xl bg-rose-200 px-3 py-2 text-xs text-slate-900 transition hover:bg-rose-100" @click="store.deleteComment(comment.id)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TablePager :page="page" :page-count="pageCount" :total="filteredComments.length" :page-size="pageSize" @prev="setPage(page - 1)" @next="setPage(page + 1)" />
    </SectionCard>

    <SectionCard title="评论详情" description="关联展示评论对应的用户信息，便于快速审核">
      <div v-if="selectedComment" class="space-y-4">
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-[0.3em] text-blue-600">Comment Profile</p>
              <h3 class="mt-2 text-2xl font-semibold text-slate-900">{{ selectedComment.userNickname }}</h3>
            </div>
            <StatusPill :value="selectedComment.status" />
          </div>
          <p class="mt-4 text-sm leading-7 text-slate-600">{{ selectedComment.content }}</p>
        </div>

        <div class="grid gap-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><p class="text-xs text-slate-500">所属模块</p><p class="mt-2 text-sm text-slate-900">{{ selectedComment.module }}</p></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><p class="text-xs text-slate-500">来源页面</p><p class="mt-2 text-sm text-slate-900">{{ selectedComment.sourceTitle ?? '-' }}</p></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><p class="text-xs text-slate-500">发布时间</p><p class="mt-2 text-sm text-slate-900">{{ selectedComment.publishedAt }}</p></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><p class="text-xs text-slate-500">用户邮箱</p><p class="mt-2 text-sm text-slate-900">{{ selectedComment.userEmail }}</p></div>
        </div>
      </div>
      <p v-else class="text-sm text-slate-500">请选择列表中的一条评论查看详情。</p>
    </SectionCard>
  </div>
</template>