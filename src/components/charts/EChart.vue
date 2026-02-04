<template>
  <div ref="el" :style="{ width, height }"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import * as echarts from "echarts";

const props = defineProps<{
  option: any;
  width?: string;
  height?: string;
}>();

const width = props.width ?? "100%";
const height = props.height ?? "220px";

const el = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function render() {
  if (!chart) return;
  chart.setOption(props.option, true);
  chart.resize();
}

onMounted(() => {
  if (!el.value) return;
  chart = echarts.init(el.value);
  render();
  window.addEventListener("resize", render);
});

watch(
  () => props.option,
  () => render(),
  { deep: true }
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", render);
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>
