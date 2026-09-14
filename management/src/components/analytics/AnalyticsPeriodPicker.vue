<script setup lang="ts">
import { CalendarDays, RefreshCw } from '@lucide/vue'
import type { AnalyticsPeriodPreset } from '../../types/analytics'

defineProps<{
  startDate: string
  endDate: string
  activePreset: AnalyticsPeriodPreset | null
  loading: boolean
}>()

const emit = defineEmits<{
  selectPreset: [preset: AnalyticsPeriodPreset]
  updateStartDate: [value: string]
  updateEndDate: [value: string]
  apply: []
}>()

const presets: Array<{ value: AnalyticsPeriodPreset; label: string }> = [
  { value: 'previous_month', label: '上一个月' },
  { value: 'this_month', label: '本月' },
  { value: 'this_week', label: '本周' },
  { value: 'previous_week', label: '上一周' },
  { value: 'this_year', label: '本年度' },
]

function inputValue(event: Event) {
  return (event.target as HTMLInputElement).value
}
</script>

<template>
  <section class="period-picker config-panel" aria-label="统计周期">
    <div class="period-presets">
      <span class="period-label"><CalendarDays aria-hidden="true" />快捷时间</span>
      <button
        v-for="preset in presets"
        :key="preset.value"
        class="period-button"
        :class="{ active: activePreset === preset.value }"
        type="button"
        :disabled="loading"
        @click="emit('selectPreset', preset.value)"
      >
        {{ preset.label }}
      </button>
    </div>

    <div class="manual-period">
      <label>
        开始日期
        <input :value="startDate" type="date" :max="endDate" @input="emit('updateStartDate', inputValue($event))" />
      </label>
      <label>
        结束日期
        <input :value="endDate" type="date" :min="startDate" @input="emit('updateEndDate', inputValue($event))" />
      </label>
      <button class="primary-button compact" type="button" :disabled="loading" @click="emit('apply')">
        <RefreshCw class="button-icon" :class="{ spinning: loading }" aria-hidden="true" />
        <span>{{ loading ? '加载中' : '应用日期' }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.period-picker {
  margin-top: 18px;
  display: grid;
  gap: 18px;
}

.period-presets,
.manual-period {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 10px;
}

.period-label {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-right: 4px;
  color: #475569;
  font-size: 13px;
  font-weight: 850;
}

.period-label svg {
  width: 18px;
  height: 18px;
  color: var(--signal);
}

.period-button {
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 0 15px;
  background: #fff;
  color: #475569;
  font-weight: 800;
}

.period-button:hover:not(:disabled) {
  border-color: #94a3b8;
  background: #f8fafc;
}

.period-button.active {
  border-color: #0f766e;
  background: #e6f4f1;
  color: #0f766e;
  box-shadow: inset 0 0 0 1px #0f766e;
}

.period-button:disabled { cursor: not-allowed; opacity: 0.65; }
.manual-period { padding-top: 16px; border-top: 1px solid var(--border); }
.manual-period label { display: grid; gap: 7px; color: #475569; font-size: 12px; font-weight: 800; }
.manual-period input { width: 160px; }
.spinning { animation: analytics-spin 0.8s linear infinite; }

@keyframes analytics-spin { to { transform: rotate(360deg); } }

@media (max-width: 620px) {
  .period-presets,
  .manual-period { align-items: stretch; }
  .period-label { width: 100%; }
  .period-button { flex: 1 1 calc(50% - 10px); }
  .manual-period label,
  .manual-period input,
  .manual-period button { width: 100%; }
}
</style>
