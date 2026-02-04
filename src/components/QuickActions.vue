<template>
  <div class="card">
    <div class="title">一键动作（演示脚本）</div>

    <div class="row">
      <button class="btn" @click="injectBarrage">压制式干扰 注入30s</button>
      <button class="btn" @click="injectBlock">阻塞式干扰 注入30s</button>
      <button class="btn" @click="clearInjection">撤收干扰</button>
    </div>

    <div class="hr"></div>

    <div class="row">
      <button class="btn" @click="setStrategy('fhss')">切换策略 FHSS</button>
      <button class="btn" @click="setStrategy('power_control')">
        切换策略 功控
      </button>
      <button class="btn" @click="setStrategy('reconfig_route')">
        切换策略 重构
      </button>
      <button class="btn" @click="setStrategy('baseline')">恢复 基线</button>
    </div>

    <div class="small" style="margin-top: 8px">
      注入时长按仿真时间计算（30s）；阻塞式主要抬升时延/抖动并显著增加视频卡顿。
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RedConfig } from "../sim/types";

const emit = defineEmits<{
  (e: "inject", kind: "barrage" | "block", seconds: number): void;
  (e: "clear"): void;
  (e: "strategy", v: RedConfig["strategy"]): void;
}>();

function injectBarrage() {
  emit("inject", "barrage", 30);
}
function injectBlock() {
  emit("inject", "block", 30);
}
function clearInjection() {
  emit("clear");
}
function setStrategy(v: RedConfig["strategy"]) {
  emit("strategy", v);
}
</script>
