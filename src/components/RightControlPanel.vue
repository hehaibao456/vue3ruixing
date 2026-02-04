<template>
  <div class="card">
    <QuickActions
      @inject="(k, s) => emit('quick:inject', k, s)"
      @clear="() => emit('quick:clear')"
      @strategy="v => emit('quick:strategy', v)"
    />
    <div class="hr"></div>
    <BlueIntensityGauge
      :intensity="hotBlue.intensity"
      :shipJamming="hotBlue.shipJamming"
      :uavSpectrumJamming="hotBlue.uavSpectrumJamming"
      :teamCommJamming="hotBlue.teamCommJamming"
    />
    <div class="hr"></div>
    <div class="sectionTitle">
      <div class="sectionBar blue"></div>
      <div class="sectionText">热控制（运行中立即生效）</div>
    </div>
    <!-- <div class="title">热控制（运行中立即生效）</div> -->
    <div class="field">
      <div class="sectionTitle">
        <div class="sectionBar blue"></div>
        <div class="sectionText">蓝方干扰源（运行中立即生效）</div>
      </div>

      <!-- 干扰源1：船 -->
      <div class="card" style="margin-top: 10px">
        <div class="title">干扰源1（对船）</div>
        <div class="field">
          <div class="small">干扰方式</div>
          <select
            class="input"
            v-model="hotBlue.shipJammer.mode"
            @change="emitHotBlue"
          >
            <option value="none">无</option>
            <option value="spot">点频</option>
            <option value="sweep">扫频</option>
            <option value="barrage">压制</option>
          </select>
        </div>
        <div class="field">
          <div class="small">强度 0~1</div>
          <input
            class="input"
            type="number"
            min="0"
            max="1"
            step="0.05"
            v-model.number="hotBlue.shipJammer.intensity"
            @change="emitHotBlue"
          />
        </div>
        <div class="row">
          <div class="field" style="flex: 1">
            <div class="small">半径 km</div>
            <input
              class="input"
              type="number"
              min="0.2"
              step="0.2"
              v-model.number="hotBlue.shipJammer.radiusKm"
              @change="emitHotBlue"
            />
          </div>
          <div class="field" style="flex: 1">
            <div class="small">Lon</div>
            <input
              class="input"
              type="number"
              step="0.001"
              v-model.number="hotBlue.shipJammer.pos.lon"
              @change="emitHotBlue"
            />
          </div>
          <div class="field" style="flex: 1">
            <div class="small">Lat</div>
            <input
              class="input"
              type="number"
              step="0.001"
              v-model.number="hotBlue.shipJammer.pos.lat"
              @change="emitHotBlue"
            />
          </div>
        </div>
      </div>

      <!-- 干扰源2：无人机 -->
      <div class="card" style="margin-top: 10px">
        <div class="title">干扰源2（对无人机）</div>
        <div class="field">
          <div class="small">干扰方式</div>
          <select
            class="input"
            v-model="hotBlue.uavJammer.mode"
            @change="emitHotBlue"
          >
            <option value="none">无</option>
            <option value="spot">点频</option>
            <option value="sweep">扫频</option>
            <option value="barrage">压制</option>
          </select>
        </div>
        <div class="field">
          <div class="small">强度 0~1</div>
          <input
            class="input"
            type="number"
            min="0"
            max="1"
            step="0.05"
            v-model.number="hotBlue.uavJammer.intensity"
            @change="emitHotBlue"
          />
        </div>
        <div class="row">
          <div class="field" style="flex: 1">
            <div class="small">半径 km</div>
            <input
              class="input"
              type="number"
              min="0.2"
              step="0.2"
              v-model.number="hotBlue.uavJammer.radiusKm"
              @change="emitHotBlue"
            />
          </div>
          <div class="field" style="flex: 1">
            <div class="small">Lon</div>
            <input
              class="input"
              type="number"
              step="0.001"
              v-model.number="hotBlue.uavJammer.pos.lon"
              @change="emitHotBlue"
            />
          </div>
          <div class="field" style="flex: 1">
            <div class="small">Lat</div>
            <input
              class="input"
              type="number"
              step="0.001"
              v-model.number="hotBlue.uavJammer.pos.lat"
              @change="emitHotBlue"
            />
          </div>
        </div>
      </div>

      <!-- 干扰源3：登岛人员（矩形） -->
      <div class="card" style="margin-top: 10px">
        <div class="title">干扰源3（对登岛人员，矩形区域）</div>
        <div class="field">
          <div class="small">干扰方式</div>
          <select
            class="input"
            v-model="hotBlue.teamJammer.mode"
            @change="emitHotBlue"
          >
            <option value="none">无</option>
            <option value="spot">点频</option>
            <option value="sweep">扫频</option>
            <option value="barrage">压制</option>
          </select>
        </div>
        <div class="field">
          <div class="small">强度 0~1</div>
          <input
            class="input"
            type="number"
            min="0"
            max="1"
            step="0.05"
            v-model.number="hotBlue.teamJammer.intensity"
            @change="emitHotBlue"
          />
        </div>
        <div class="row">
          <div class="field" style="flex: 1">
            <div class="small">半边长 km（radius）</div>
            <input
              class="input"
              type="number"
              min="0.2"
              step="0.2"
              v-model.number="hotBlue.teamJammer.radiusKm"
              @change="emitHotBlue"
            />
          </div>
          <div class="field" style="flex: 1">
            <div class="small">Center Lon</div>
            <input
              class="input"
              type="number"
              step="0.001"
              v-model.number="hotBlue.teamJammer.center.lon"
              @change="emitHotBlue"
            />
          </div>
          <div class="field" style="flex: 1">
            <div class="small">Center Lat</div>
            <input
              class="input"
              type="number"
              step="0.001"
              v-model.number="hotBlue.teamJammer.center.lat"
              @change="emitHotBlue"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="field">
      <div class="small">红方抗干扰策略</div>
      <select class="input" v-model="hotRedStrategy" @change="emitHotRed">
        <option value="baseline">基线（无）</option>
        <option value="fhss">跳频 FHSS</option>
        <option value="power_control">功控</option>
        <option value="reconfig_route">重构路由/链路</option>
      </select>
    </div>

    <div class="field">
      <div class="small">蓝方总体干扰强度（0~1）</div>
      <input
        class="input"
        type="number"
        min="0"
        max="1"
        step="0.05"
        v-model.number="hotBlue.intensity"
        @change="emitHotBlue"
      />
    </div>

    <div class="field">
      <div class="small">船：电磁干扰</div>
      <select class="input" v-model="hotBlue.shipJamming" @change="emitHotBlue">
        <option value="none">无</option>
        <option value="spot">点频</option>
        <option value="sweep">扫频</option>
        <option value="barrage">压制</option>
      </select>
    </div>

    <div class="field">
      <div class="small">无人机：频谱干扰</div>
      <select
        class="input"
        v-model="hotBlue.uavSpectrumJamming"
        @change="emitHotBlue"
      >
        <option value="none">无</option>
        <option value="spot">点频</option>
        <option value="sweep">扫频</option>
        <option value="barrage">压制</option>
      </select>
    </div>

    <div class="field">
      <div class="small">登岛人员：通信干扰</div>
      <select
        class="input"
        v-model="hotBlue.teamCommJamming"
        @change="emitHotBlue"
      >
        <option value="none">无</option>
        <option value="spot">点频</option>
        <option value="sweep">扫频</option>
        <option value="barrage">压制</option>
      </select>
    </div>

    <div class="hr"></div>

    <div class="title">静态配置（需停止后应用）</div>

    <div class="field">
      <div class="small">演练时长 X（分钟）</div>
      <input
        class="input"
        type="number"
        min="1"
        v-model.number="redLocal.durationMin"
        :disabled="running"
      />
    </div>

    <div class="field">
      <div class="small">步长 dt（毫秒）</div>
      <input
        class="input"
        type="number"
        min="100"
        step="100"
        v-model.number="redLocal.dtMs"
        :disabled="running"
      />
    </div>

    <div class="hr"></div>

    <RedSettings v-model="redLocal" :disabled="running" />
    <div class="hr"></div>

    <button class="btn" :disabled="running" @click="applyStatic">
      应用静态配置
    </button>
    <div class="small" style="margin-top: 8px">
      热控制项无需点击应用；静态项仅在停止时可应用。
    </div>
  </div>
</template>

<script setup lang="ts">
import QuickActions from "./QuickActions.vue";
import { reactive, ref, watch } from "vue";
import type { BlueConfig, RedConfig } from "../sim/types";
import RedSettings from "./forms/RedSettings.vue";
import BlueIntensityGauge from "./charts/BlueIntensityGauge.vue";
const props = defineProps<{
  red: RedConfig;
  blue: BlueConfig;
  running: boolean;
}>();

const emit = defineEmits<{
  (e: "update:red", v: RedConfig): void;
  (e: "update:blue", v: BlueConfig): void;
  (e: "hot:redStrategy", v: RedConfig["strategy"]): void;
  (e: "hot:blue", v: BlueConfig): void;
  (e: "quick:inject", kind: "barrage" | "block", seconds: number): void;
  (e: "quick:clear"): void;
  (e: "quick:strategy", v: RedConfig["strategy"]): void;
}>();

const redLocal = reactive<RedConfig>({ ...props.red });
watch(
  () => props.red,
  v => Object.assign(redLocal, v),
  { deep: true }
);

const hotBlue = reactive<BlueConfig>({ ...props.blue });
watch(
  () => props.blue,
  v => Object.assign(hotBlue, v),
  { deep: true }
);

const hotRedStrategy = ref<RedConfig["strategy"]>(props.red.strategy);
watch(
  () => props.red.strategy,
  v => (hotRedStrategy.value = v)
);

function emitHotBlue() {
  emit("hot:blue", { ...hotBlue });
}
function emitHotRed() {
  emit("hot:redStrategy", hotRedStrategy.value);
}
function applyStatic() {
  emit("update:red", { ...redLocal, strategy: props.red.strategy }); // static 不改策略
}
</script>
<style scoped>
.sectionTitle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(120, 150, 255, 0.18);
  background: rgba(8, 12, 24, 0.45);
  margin: 10px 0 8px 0;
}
.sectionBar {
  width: 10px;
  height: 18px;
  border-radius: 6px;
}
.sectionBar.red {
  background: #ff4d6d;
}
.sectionBar.blue {
  background: #5aa6ff;
}
.sectionBar.gray {
  background: #93a4c7;
}
.sectionText {
  font-weight: 700;
  color: #d7e3ff;
}
</style>
