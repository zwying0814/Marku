<script setup lang="ts">
import { computed } from 'vue'
import { useAdminStore } from '../stores/admin'
import SectionCard from '../components/SectionCard.vue'

const store = useAdminStore()

const summaryCards = computed(() => store.counters.map((counter) => ({
  ...counter,
  trendLabel: counter.delta && counter.delta > 0 ? `+${counter.delta}%` : '0%',
})))

function increase(counterKey: string) {
  const counter = store.counters.find((item) => item.key === counterKey)
  if (!counter) return
  store.updateCounter(counterKey, counter.value + 1)
}

function decrease(counterKey: string) {
  const counter = store.counters.find((item) => item.key === counterKey)
  if (!counter) return
  store.updateCounter(counterKey, Math.max(0, counter.value - 1))
}
</script>

<template>
  <div class="space-y-6">
    <SectionCard title="计数器管理" description="展示阅读量、评论数、访问量等统计数据，支持手动重置和修改">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div v-for="counter in summaryCards" :key="counter.key" class="rounded-[1.75rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm text-slate-500">{{ counter.label }}</p>
              <p class="mt-3 text-4xl font-semibold text-slate-900">{{ counter.value }}</p>
            </div>
            <span class="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 ring-1 ring-blue-200">{{ counter.trendLabel }}</span>
          </div>
          <p class="mt-4 text-sm leading-6 text-slate-500">{{ counter.description }}</p>
          <div class="mt-5 flex flex-wrap gap-2">
            <button class="rounded-xl bg-emerald-200 px-3 py-2 text-xs font-medium text-slate-900 transition hover:bg-emerald-100" @click="increase(counter.key)">+1</button>
            <button class="rounded-xl bg-amber-200 px-3 py-2 text-xs font-medium text-slate-900 transition hover:bg-amber-100" @click="decrease(counter.key)">-1</button>
            <button class="rounded-xl bg-rose-200 px-3 py-2 text-xs font-medium text-slate-900 transition hover:bg-rose-100" @click="store.resetCounter(counter.key)">重置</button>
          </div>
        </div>
      </div>
    </SectionCard>

    <section class="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
      <SectionCard title="统计总览" description="用简洁数字展示系统核心指标，替代重型图表">
        <div class="space-y-3">
          <div v-for="counter in store.counters" :key="counter.key" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm text-slate-500">{{ counter.label }}</p>
            <div class="mt-2 flex items-end justify-between gap-3">
              <p class="text-3xl font-semibold text-slate-900">{{ counter.value }}</p>
              <p class="text-xs text-slate-500">最近变动 {{ counter.delta ?? 0 }}%</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="快速调整" description="直接修改各类计数器的当前值">
        <div class="space-y-4">
          <div v-for="counter in store.counters" :key="counter.key" class="rounded-2xl border border-slate-200 bg-white p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="text-sm font-medium text-slate-900">{{ counter.label }}</p>
              <div class="flex items-center gap-2">
                <button class="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 transition hover:bg-slate-50" @click="decrease(counter.key)">-</button>
                <button class="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 transition hover:bg-slate-50" @click="increase(counter.key)">+</button>
              </div>
            </div>
            <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">当前值：{{ counter.value }}</div>
          </div>
        </div>
      </SectionCard>
    </section>
  </div>
</template>