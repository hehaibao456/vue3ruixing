<template>
  <div class="card">
    <div class="title">蓝方设置</div>

    <div class="field">
      <div class="small">总体干扰强度（0~1）</div>
      <input
        class="input"
        type="number"
        min="0"
        max="1"
        step="0.05"
        v-model.number="m.intensity"
        :disabled="disabled"
      />
    </div>

    <div class="field">
      <div class="small">针对通信船的电磁干扰</div>
      <select class="input" v-model="m.shipJamming" :disabled="disabled">
        <option value="none">无</option>
        <option value="spot">点频</option>
        <option value="sweep">扫频</option>
        <option value="barrage">压制（宽带）</option>
      </select>
    </div>

    <div class="field">
      <div class="small">针对无人机的频谱干扰</div>
      <select class="input" v-model="m.uavSpectrumJamming" :disabled="disabled">
        <option value="none">无</option>
        <option value="spot">点频</option>
        <option value="sweep">扫频</option>
        <option value="barrage">压制（宽带）</option>
      </select>
    </div>

    <div class="field">
      <div class="small">针对登岛人员的通信干扰</div>
      <select class="input" v-model="m.teamCommJamming" :disabled="disabled">
        <option value="none">无</option>
        <option value="spot">点频</option>
        <option value="sweep">扫频</option>
        <option value="barrage">压制（宽带）</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BlueConfig } from "../../sim/types";
const m = defineModel<BlueConfig>({ required: true });
defineProps<{ disabled: boolean }>();
</script>
