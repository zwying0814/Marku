<script setup lang="ts">
defineProps<{
  page: number
  pageCount: number
  total: number
  pageSize: number
}>()

const emit = defineEmits<{
  (event: 'prev'): void
  (event: 'next'): void
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
    <p>共 {{ total }} 条数据，每页 {{ pageSize }} 条，第 {{ page }} / {{ Math.max(pageCount, 1) }} 页</p>
    <div class="flex items-center gap-2">
      <button class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" :disabled="page <= 1" @click="emit('prev')">上一页</button>
      <button class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" :disabled="page >= pageCount" @click="emit('next')">下一页</button>
    </div>
  </div>
</template>