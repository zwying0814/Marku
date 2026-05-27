<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
        <p v-if="description" class="mt-1 text-sm leading-6 text-slate-500">{{ description }}</p>
      </div>
      <slot name="extra"></slot>
    </div>
    <div class="mt-5">
      <slot></slot>
    </div>
  </section>
</template>