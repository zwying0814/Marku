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
const selectedUserId = ref<number | null>(store.users[0]?.id ?? null)

const filteredUsers = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return store.users
  return store.users.filter((user) => [user.account, user.email, user.location, user.bio].filter(Boolean).join(' ').toLowerCase().includes(keyword))
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize)))

const visibleUsers = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredUsers.value.slice(start, start + pageSize)
})

const selectedUser = computed(() => store.users.find((item) => item.id === selectedUserId.value) ?? null)

function setPage(nextPage: number) {
  page.value = Math.min(Math.max(nextPage, 1), pageCount.value)
}

function onSearch() {
  page.value = 1
}

function toggleStatus(id: number) {
  store.toggleUserStatus(id)
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
    <SectionCard title="用户管理" description="展示 ID、账号、邮箱、注册时间、状态，支持搜索、分页与状态切换">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1">
          <input v-model="query" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300" placeholder="搜索账号 / 邮箱 / 地区 / 备注" @input="onSearch" />
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">共 {{ filteredUsers.length }} 位用户</div>
      </div>

      <div class="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="px-4 py-3 font-medium">ID</th>
              <th class="px-4 py-3 font-medium">账号</th>
              <th class="px-4 py-3 font-medium">邮箱</th>
              <th class="px-4 py-3 font-medium">注册时间</th>
              <th class="px-4 py-3 font-medium">状态</th>
              <th class="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-for="user in visibleUsers" :key="user.id" class="transition hover:bg-slate-50">
              <td class="px-4 py-4 text-slate-600">{{ user.id }}</td>
              <td class="px-4 py-4">
                <button class="font-medium text-slate-900 transition hover:text-blue-600" @click="selectedUserId = user.id">{{ user.account }}</button>
              </td>
              <td class="px-4 py-4 text-slate-600">{{ user.email }}</td>
              <td class="px-4 py-4 text-slate-600">{{ user.registeredAt }}</td>
              <td class="px-4 py-4"><StatusPill :value="user.status" /></td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-2">
                  <button class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50" @click="selectedUserId = user.id">查看详情</button>
                  <button class="rounded-xl px-3 py-2 text-xs text-slate-900 transition" :class="user.status === 'normal' ? 'bg-amber-200 hover:bg-amber-100' : 'bg-emerald-200 hover:bg-emerald-100'" @click="toggleStatus(user.id)">{{ user.status === 'normal' ? '禁用' : '启用' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TablePager :page="page" :page-count="pageCount" :total="filteredUsers.length" :page-size="pageSize" @prev="setPage(page - 1)" @next="setPage(page + 1)" />
    </SectionCard>

    <SectionCard title="用户详情" description="展示当前选中用户的基础信息与操作状态">
      <div v-if="selectedUser" class="space-y-4">
        <div class="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-blue-600">User Profile</p>
            <h3 class="mt-2 text-2xl font-semibold text-slate-900">{{ selectedUser.account }}</h3>
            <p class="mt-2 text-sm text-slate-500">{{ selectedUser.bio }}</p>
          </div>
          <StatusPill :value="selectedUser.status" />
        </div>

        <div class="grid gap-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><p class="text-xs text-slate-500">邮箱</p><p class="mt-2 text-sm text-slate-900">{{ selectedUser.email }}</p></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><p class="text-xs text-slate-500">注册时间</p><p class="mt-2 text-sm text-slate-900">{{ selectedUser.registeredAt }}</p></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><p class="text-xs text-slate-500">最近登录</p><p class="mt-2 text-sm text-slate-900">{{ selectedUser.lastLoginAt ?? '-' }}</p></div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4"><p class="text-xs text-slate-500">所在地</p><p class="mt-2 text-sm text-slate-900">{{ selectedUser.location ?? '-' }}</p></div>
        </div>
      </div>
      <p v-else class="text-sm text-slate-500">请选择列表中的一条用户记录查看详情。</p>
    </SectionCard>
  </div>
</template>