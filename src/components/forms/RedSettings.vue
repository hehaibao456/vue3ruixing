<template>
  <div class="card">
    <div class="title">红方设置</div>

    <div class="field">
      <div class="small">抗干扰策略</div>
      <select class="input" v-model="m.strategy" :disabled="disabled">
        <option value="baseline">基线（无）</option>
        <option value="fhss">跳频 FHSS</option>
        <option value="power_control">功控</option>
        <option value="reconfig_route">重构路由/链路</option>
      </select>
    </div>

    <div class="field">
      <div class="small">特战小组数量</div>
      <input
        class="input"
        type="number"
        min="1"
        max="24"
        v-model.number="m.teamCount"
        :disabled="disabled"
      />
    </div>

    <div class="field">
      <div class="small">旋翼无人机范围（km，默认 1）</div>
      <input
        class="input"
        type="number"
        min="0.5"
        step="0.1"
        v-model.number="m.rwUavRangeKm"
        :disabled="disabled"
      />
    </div>

    <div class="field">
      <div class="small">固定翼无人机范围（km，默认 3，指向型示意）</div>
      <input
        class="input"
        type="number"
        min="1"
        step="0.5"
        v-model.number="m.fwUavRangeKm"
        :disabled="disabled"
      />
    </div>
    <div class="field">
      <div class="small">固定翼波束宽度（deg，示意，推荐 30~90）</div>
      <input
        class="input"
        type="number"
        min="10"
        max="180"
        step="5"
        v-model.number="m.fwUavBeamDeg"
        :disabled="disabled"
      />
    </div>

    <div class="field">
      <div class="small">固定翼主瓣指向（deg，0=北 90=东 180=南 270=西）</div>
      <input
        class="input"
        type="number"
        min="0"
        max="359"
        step="5"
        v-model.number="m.fwUavPointingDeg"
        :disabled="disabled"
      />
    </div>

    <div class="hr"></div>

    <div class="small mono">通信船位置（lon/lat）</div>
    <div class="row">
      <input
        class="input"
        style="flex: 1"
        v-model.number="m.shipPos.lon"
        :disabled="disabled"
      />
      <input
        class="input"
        style="flex: 1"
        v-model.number="m.shipPos.lat"
        :disabled="disabled"
      />
    </div>

    <div class="hr"></div>

    <div class="small mono">登岛人员起点（lon/lat）</div>
    <div class="row">
      <input
        class="input"
        style="flex: 1"
        v-model.number="m.teamsStart.lon"
        :disabled="disabled"
      />
      <input
        class="input"
        style="flex: 1"
        v-model.number="m.teamsStart.lat"
        :disabled="disabled"
      />
    </div>

    <div class="small mono">登岛人员目标（lon/lat）</div>
    <div class="row">
      <input
        class="input"
        style="flex: 1"
        v-model.number="m.teamsGoal.lon"
        :disabled="disabled"
      />
      <input
        class="input"
        style="flex: 1"
        v-model.number="m.teamsGoal.lat"
        :disabled="disabled"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RedConfig } from "../../sim/types";
const m = defineModel<RedConfig>({ required: true });
defineProps<{ disabled: boolean }>();
</script>
