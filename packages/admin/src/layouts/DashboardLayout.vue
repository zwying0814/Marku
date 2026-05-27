<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)

const menuItems = [
  { name: '仪表盘', path: '/', key: 'dashboard' },
  { name: '用户管理', path: '/users', key: 'users' },
  { name: '评论管理', path: '/comments', key: 'comments' },
  { name: '计数器管理', path: '/counters', key: 'counters' },
]

const currentMenuName = computed(() => menuItems.find((item) => item.path === route.path)?.name ?? '仪表盘')

function navigate(path: string) {
  router.push(path)
  menuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <div class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.08),transparent_22%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]"></div>

    <div class="mx-auto flex min-h-screen max-w-[1800px] flex-col lg:flex-row">
      <aside class="border-b border-slate-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r lg:border-slate-200">
        <div class="flex items-center justify-between lg:block">
          <div>
            <p class="text-xs uppercase tracking-[0.35em] text-blue-600">Marku Admin</p>
            <h1 class="mt-2 text-2xl font-semibold text-slate-900">后台管理</h1>
          </div>
          <button
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 lg:hidden"
            type="button"
            @click="menuOpen = !menuOpen"
          >
            菜单
          </button>
        </div>

        <nav :class="['mt-6 space-y-2 lg:mt-10', menuOpen ? 'block' : 'hidden lg:block']">
          <button
            v-for="item in menuItems"
            :key="item.path"
            type="button"
            class="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition"
            :class="route.path === item.path ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
            @click="navigate(item.path)"
          >
            <span>{{ item.name }}</span>
            <span class="text-xs uppercase tracking-[0.24em] opacity-60">{{ item.key }}</span>
          </button>
        </nav>

        <div class="mt-auto hidden rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:block">
          <p class="text-sm text-slate-500">当前页面</p>
          <p class="mt-2 text-lg font-medium text-slate-900">{{ currentMenuName }}</p>
          <p class="mt-3 text-xs leading-6 text-slate-500">经典左侧菜单 + 右侧内容区布局，适配后台高频操作场景。</p>
        </div>
      </aside>

      <div class="flex min-h-screen flex-1 flex-col">
        <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-5 py-4 backdrop-blur">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-sm text-slate-500">Marku Administration</p>
              <h2 class="mt-1 text-xl font-semibold text-slate-900">{{ currentMenuName }}</h2>
            </div>
            <div class="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              在线运行中
            </div>
          </div>
        </header>

        <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <router-view />
        </main>

        <footer class="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span>Marku 后台管理系统</span>
            <span>简洁 · 现代 · 响应式</span>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>