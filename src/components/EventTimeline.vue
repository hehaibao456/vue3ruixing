<template>
  <div class="card">
    <div class="title">事件时间线（最近 {{ max }} 条）</div>
    <div v-if="!items.length" class="small">暂无事件</div>
    <div
      v-for="e in items"
      :key="e.tMs + e.msg"
      class="card"
      style="margin-top: 8px"
    >
      <div class="row" style="justify-content: space-between">
        <div class="mono">
          <b>{{ e.type }}</b>
        </div>
        <div class="mono small">t={{ (e.tMs / 1000).toFixed(1) }}s</div>
      </div>
      <div class="small">{{ e.msg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  events: { tMs: number; type: string; msg: string }[];
  max?: number;
}>();
const max = props.max ?? 30;

const items = computed(() => {
  const arr = props.events ?? [];
  return arr.slice(Math.max(0, arr.length - max));
});
</script>
