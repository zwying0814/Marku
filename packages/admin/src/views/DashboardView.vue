<script setup lang="ts">
import { computed } from 'vue'
import SectionCard from '../components/SectionCard.vue'
import StatusPill from '../components/StatusPill.vue'
import { useAdminStore } from '../stores/admin'

const store = useAdminStore()

const topMetrics = computed(() => [
  { label: '用户总数', value: store.dashboardTotals.users, hint: `${store.dashboardTotals.disabledUsers} 个已禁用` },
  { label: '评论总数', value: store.dashboardTotals.comments, hint: `${store.dashboardTotals.pendingComments} 条待审核` },
  { label: '访问量', value: store.counters.find((item) => item.key === 'views')?.value ?? 0, hint: '核心访问指标' },
  { label: '阅读量', value: store.counters.find((item) => item.key === 'reads')?.value ?? 0, hint: '内容活跃指标' },
])
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <div class="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <p class="text-xs uppercase tracking-[0.35em] text-blue-600">Admin Dashboard</p>
        <h2 class="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">高频管理操作的统一控制台</h2>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">左侧菜单、右侧内容、顶部状态、底部信息一体化布局，适合用户、评论、计数器等后台管理场景。</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <StatusPill value="approved" />
          <StatusPill value="pending" />
          <StatusPill value="normal" />
        </div>
      </div>

      <SectionCard title="系统状态" description="当前后台的数据总览与运行状态">
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="item in topMetrics" :key="item.label" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm text-slate-500">{{ item.label }}</p>
            <p class="mt-3 text-3xl font-semibold text-slate-900">{{ item.value }}</p>
            <p class="mt-2 text-xs text-slate-500">{{ item.hint }}</p>
          </div>
        </div>
      </SectionCard>
    </section>

    <section class="grid gap-4 xl:grid-cols-3">
      <SectionCard title="最近用户" description="展示近期注册/活跃用户的简要状态">
        <div class="space-y-3">
          <div v-for="user in store.users.slice(0, 4)" :key="user.id" class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p class="font-medium text-slate-900">{{ user.account }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ user.email }}</p>
            </div>
            <StatusPill :value="user.status" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="待审核评论" description="快速查看仍需处理的评论内容">
        <div class="space-y-3">
          <div v-for="comment in store.comments.filter((item) => item.status === 'pending').slice(0, 4)" :key="comment.id" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="font-medium text-slate-900">{{ comment.userNickname }}</p>
              <StatusPill :value="comment.status" />
            </div>
            <p class="mt-2 text-sm leading-6 text-slate-500">{{ comment.content }}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="计数器摘要" description="简洁数字统计，适合后台总览">
        <div class="grid gap-3">
          <div v-for="counter in store.counters" :key="counter.key" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm text-slate-500">{{ counter.label }}</p>
              <p class="text-xs text-blue-600">{{ counter.delta }}%</p>
            </div>
            <p class="mt-3 text-3xl font-semibold text-slate-900">{{ counter.value }}</p>
          </div>
        </div>
      </SectionCard>
    </section>
  </div>
</template>