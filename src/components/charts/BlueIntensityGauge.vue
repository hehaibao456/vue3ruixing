<template>
  <div class="card">
    <div class="hrow">
      <div class="title">蓝方干扰强度</div>
      <div class="badge blue">JAM</div>
    </div>
    <EChart :height="'180px'" :option="opt" />
    <div class="small mono">
      I={{ intensity?.toFixed(2) }} · ship={{ shipJamming }} · uav={{
        uavSpectrumJamming
      }}
      · team={{ teamCommJamming }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import EChart from "./EChart.vue";

const props = defineProps<{
  intensity: number;
  shipJamming: string;
  uavSpectrumJamming: string;
  teamCommJamming: string;
}>();

const opt = computed(() => ({
  backgroundColor: "transparent",
  series: [
    {
      type: "gauge",
      min: 0,
      max: 1,
      splitNumber: 5,
      axisLine: {
        lineStyle: {
          width: 10,
          color: [
            [0.4, "#2ee59d"],
            [0.7, "#ffd166"],
            [1, "#ff4d6d"]
          ]
        }
      },
      pointer: { width: 4, length: "70%" },
      axisLabel: { color: "#cfe0ff" },
      splitLine: { length: 10, lineStyle: { color: "rgba(120,150,255,.35)" } },
      detail: {
        valueAnimation: true,
        formatter: "{value}",
        color: "#d7e3ff",
        fontSize: 18
      },
      data: [{ value: Number(props.intensity?.toFixed(2)) }]
    }
  ]
}));
</script>

<style scoped>
.hrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(120, 150, 255, 0.25);
  color: #cfe0ff;
  background: rgba(90, 130, 255, 0.18);
}
</style>
