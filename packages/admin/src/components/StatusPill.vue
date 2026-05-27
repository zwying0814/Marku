<script setup lang="ts">
const props = defineProps<{
  value: string
}>()

const styleMap: Record<string, string> = {
  normal: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  disabled: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  blocked: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}
</script>

<template>
  <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize tracking-wide" :class="styleMap[props.value] ?? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'">
    {{ value }}
  </span>
</template>