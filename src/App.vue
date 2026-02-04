<template>
  <div class="layout" :class="{ fullscreen: isFullscreen }">
    <div class="panel" v-show="!isFullscreen">
      <div class="panelHeader">
        <div>态势通畅情况</div>
        <div class="row">
          <span class="badge mono">t={{ (state.tMs / 1000).toFixed(1) }}s</span>
          <span class="badge mono">dt={{ red.dtMs }}ms</span>
          <span class="badge mono">X={{ red.durationMin }}min</span>
        </div>
      </div>
      <div class="panelBody">
        <LeftSituationPanel
          :links="state.links"
          :biz="state.biz"
          :events="state.events"`
        />
      </div>
    </div>

    <div class="mapShell">
      <div class="mapToolbar">
        <button class="btn" :disabled="state.running" @click="onStart">
          启动
        </button>
        <button class="btn" :disabled="!state.running" @click="onPause">
          暂停
        </button>
        <button class="btn" @click="onReset">重置</button>
        <button class="btn" @click="toggleFullscreen">
          {{ isFullscreen ? "退出全屏" : "全屏" }}
        </button>
        <button
          class="btn"
          :disabled="state.running || state.tMs === 0"
          @click="onGenerateReport('html')"
        >
          下载HTML报告
        </button>
        <button
          class="btn"
          :disabled="state.running || state.tMs === 0"
          @click="onGenerateReport('pdf')"
        >
          导出PDF
        </button>

      </div>

      <CesiumMap
        :ship="state.ship"
        :rwUav="state.rwUav"
        :fwUav="state.fwUav"
        :teams="state.teams"
        :links="state.links"
        :fwRangeKm="red.fwUavRangeKm"
        :fwPointingDeg="red.fwUavPointingDeg"
        :fwBeamDeg="red.fwUavBeamDeg"
        :rwRangeKm="red.rwUavRangeKm"
        :autoFocus="'init'"
        :blue="blue"
      />
    </div>

    <div class="panel" v-show="!isFullscreen">
      <div class="panelHeader">
        <div>红蓝对抗配置</div>
        <span class="badge mono">{{ state.running ? "RUN" : "STOP" }}</span>
      </div>
      <div class="panelBody">
        <RightControlPanel
          v-model:red="red"
          v-model:blue="blue"
          :running="state.running"
          @hot:redStrategy="onHotRedStrategy"
          @hot:blue="onHotBlue"
          @quick:inject="onQuickInject"
          @quick:clear="onQuickClear"
          @quick:strategy="onQuickStrategy"
        />
      </div>
    </div>
  </div>
   <SystemTypewriter />
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from "vue";
import CesiumMap from "./components/CesiumMap.vue";
import LeftSituationPanel from "./components/LeftSituationPanel.vue";
import RightControlPanel from "./components/RightControlPanel.vue";
import { defaultBlue, defaultRed } from "./sim/defaults";
import { initSim, stepSim } from "./sim/engine";
import type { BlueConfig, RedConfig, SimState } from "./sim/types";
import { buildReportHtml, type Sample } from "./report/report";
import SystemTypewriter from "./components/SystemTypewriter.vue";

const samples = ref<Sample[]>([]);

const red = ref<RedConfig>({ ...defaultRed });
const blue = ref<BlueConfig>({ ...defaultBlue });

const state = reactive<SimState>(initSim(red.value));

let timer: number | null = null;
const isFullscreen = ref(false);

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

function onStart() {
  state.running = true;

  // 鉁?涓嶅仛浠讳綍鐩告満鎿嶄綔锛氫笉灞呬腑銆佷笉 flyTo
  if (timer) window.clearInterval(timer);

  timer = window.setInterval(() => {
    if (!state.running) return;

    const next = stepSim(state, red.value, blue.value);
    Object.assign(state, next);

    // 姣?1s 閲囨牱涓€娆★紙閬垮厤姣廳t閲囨牱澶瘑锛?
    if (state.tMs % 1000 < red.value.dtMs) {
      samples.value.push({
        tMs: state.tMs,
        links: state.links.map(x => ({ ...x })),
        biz: state.biz.map(x => ({ ...x }))
      });

      // 闄愬埗閲囨牱闀垮害
      if (samples.value.length > 5000) {
        samples.value.splice(0, samples.value.length - 5000);
      }
    }

    // 鍒拌揪鏃堕暱鑷姩鍋滄
    if (state.tMs >= red.value.durationMin * 60_000) {
      state.running = false;
    }
  }, red.value.dtMs);
}

function onPause() {
  state.running = false;
}

function pushEvent(type: string, msg: string) {
  state.events.push({ tMs: state.tMs, type, msg });
  if (state.events.length > 300) {
    state.events.splice(0, state.events.length - 300);
  }
}

function onHotRedStrategy(v: RedConfig["strategy"]) {
  if (red.value.strategy !== v) {
    red.value = { ...red.value, strategy: v };
    pushEvent("RED", `鍒囨崲鎶楀共鎵扮瓥鐣?-> ${v}`);
  }
}

function onHotBlue(v: BlueConfig) {
  const prev = blue.value;
  const changed =
    prev.intensity !== v.intensity ||
    prev.shipJamming !== v.shipJamming ||
    prev.uavSpectrumJamming !== v.uavSpectrumJamming ||
    prev.teamCommJamming !== v.teamCommJamming;

  if (changed) {
    blue.value = { ...v };
    pushEvent(
      "BLUE",
      `鏇存柊骞叉壈锛歴hip=${v.shipJamming}, uav=${v.uavSpectrumJamming}, team=${
        v.teamCommJamming
      }, I=${v.intensity.toFixed(2)}`
    );
  }
}

function onQuickInject(kind: "barrage" | "block", seconds: number) {
  state.injection = {
    kind,
    active: true,
    untilMs: state.tMs + seconds * 1000
  };
  const kindLabel =
    kind === "barrage" ? "\u538b\u5236\u5f0f" : "\u963b\u585e\u5f0f";
  pushEvent(
    "BLUE",
    "\u6ce8\u5165" +
      kindLabel +
      "\u5e72\u6270\uff0c\u6301\u7eed" +
      seconds +
      "s"
  );
}

function onQuickClear() {
  state.injection = { kind: "none", active: false, untilMs: 0 };
  pushEvent("BLUE", "鎾ゆ敹骞叉壈锛堟敞鍏ョ粨鏉燂級");
}

function onQuickStrategy(v: RedConfig["strategy"]) {
  onHotRedStrategy(v);
  pushEvent("RED", `涓€閿垏鎹㈢瓥鐣?-> ${v}`);
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openPrintWindow(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  // 等待一下渲染，确保样式已应用
  setTimeout(() => {
    win.print();
  }, 300);
}

function onGenerateReport(kind: "html" | "pdf") {
  const html = buildReportHtml({
    red: red.value,
    blue: blue.value,
    samples: samples.value,
    events: state.events
  });

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  if (kind === "html") {
    downloadText(`evaluation-report-${ts}.html`, html);
    state.events.push({
      tMs: state.tMs,
      type: "REPORT",
      msg: "已生成并下载评估报告（HTML）"
    });
    return;
  }

  openPrintWindow(html);
  state.events.push({
    tMs: state.tMs,
    type: "REPORT",
    msg: "已打开PDF导出窗口"
  });
}

function onReset() {
  samples.value = [];
  state.running = false;
  const fresh = initSim(red.value);
  Object.assign(state, fresh);
}

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>








