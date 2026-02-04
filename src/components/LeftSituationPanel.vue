<template>
  <div class="sGrid">
    <div class="card">
      <div class="hrow">
        <div class="title">链路态势</div>
        <div class="badge blue">LINK</div>
      </div>

      <EChart :height="'210px'" :option="optLinkSummary" />
      <div class="krow">
        <div class="kpi">
          <span class="k">上游</span>
          <span class="v mono">{{ upOk }}/{{ upTotal }}</span>
        </div>
        <div class="kpi">
          <span class="k">下行</span>
          <span class="v mono">{{ dnOk }}/{{ dnTotal }}</span>
        </div>
        <div class="kpi">
          <span class="k">DOWN</span>
          <span class="v mono bad">{{ downTotal }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="hrow">
        <div class="title">业务态势</div>
        <div class="badge red">BIZ</div>
      </div>

      <EChart :height="'210px'" :option="optBizOk" />
      <div class="krow">
        <div class="kpi">
          <span class="k">容量状态</span>
          <span class="v mono">{{ capHint }}</span>
        </div>
        <div class="kpi">
          <span class="k">视频 Alloc/Demand</span>
          <span class="v mono">{{ vAlloc }}/{{ vDemand }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="hrow">
        <div class="title">视频卡顿</div>
        <div class="badge warn">VIDEO</div>
      </div>

      <EChart :height="'210px'" :option="optVideoTrend" />
      <div class="krow">
        <div class="kpi">
          <span class="k">当前 Stall</span>
          <span class="v mono warn">{{ vStall }}/min</span>
        </div>
        <div class="kpi">
          <span class="k">P95 Lat</span>
          <span class="v mono">{{ vP95 }} ms</span>
        </div>
        <div class="kpi">
          <span class="k">OK</span>
          <span class="v mono">{{ vOk }}%</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="hrow">
        <div class="title">事件时间线</div>
        <button class="btn2" @click="open = !open">
          {{ open ? "收起" : "展开" }}
        </button>
      </div>
      <div v-if="open" class="timeline">
        <div v-if="!events.length" class="small">暂无事件</div>
        <div v-for="e in lastEvents" :key="e.tMs + e.msg" class="evt">
          <div class="mono small">{{ (e.tMs / 1000).toFixed(1) }}s</div>
          <div class="mono small tag">{{ e.type }}</div>
          <div class="small msg">{{ e.msg }}</div>
        </div>
      </div>
      <div v-else class="small">
        （已折叠）最近事件：{{ lastEvents[0]?.msg ?? "无" }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { BizKPI, LinkKPI } from "../sim/types";
import EChart from "./charts/EChart.vue";

const props = defineProps<{
  links: LinkKPI[];
  biz: BizKPI[];
  events: { tMs: number; type: string; msg: string }[];
  // 可选：你如果愿意也可传 tMs，用于更精确显示剩余时间等
}>();

const open = ref(false);

const lastEvents = computed(() => {
  const arr = props.events ?? [];
  return arr.slice(Math.max(0, arr.length - 30)).reverse();
});

const up = computed(() =>
  (props.links ?? []).filter(l => l.linkId === "L01" || l.linkId === "L02")
);
const dn = computed(() =>
  (props.links ?? []).filter(
    l => l.linkId.startsWith("L-RW-") || l.linkId.startsWith("L-FW-")
  )
);

function countStatus(arr: LinkKPI[], s: LinkKPI["status"]) {
  return arr.filter(x => x.status === s).length;
}

const upTotal = computed(() => up.value.length);
const dnTotal = computed(() => dn.value.length);

const upOk = computed(() => countStatus(up.value, "OK"));
const dnOk = computed(() => countStatus(dn.value, "OK"));
const downTotal = computed(() => countStatus(props.links ?? [], "DOWN"));

const bizMap = computed(() => {
  const m = new Map<string, BizKPI>();
  (props.biz ?? []).forEach(b => m.set(b.biz, b));
  return m;
});

const v = computed(() => bizMap.value.get("video"));
const vAlloc = computed(() => (v.value?.allocMbps ?? 0).toFixed(1));
const vDemand = computed(() => (v.value?.demandMbps ?? 0).toFixed(1));
const vStall = computed(() => (v.value?.stallPerMin ?? 0).toFixed(1));
const vP95 = computed(() => (v.value?.p95LatencyMs ?? 0).toFixed(0));
const vOk = computed(() => ((v.value?.okRatio ?? 0) * 100).toFixed(1));

const capHint = computed(() => {
  if (!v.value) return "-";
  const r = v.value.allocMbps / Math.max(v.value.demandMbps, 1e-6);
  if (r > 0.8) return "充裕";
  if (r > 0.4) return "紧张";
  return "退化";
});

const optLinkSummary = computed(() => {
  const ok = countStatus(props.links ?? [], "OK");
  const deg = countStatus(props.links ?? [], "DEGRADED");
  const down = countStatus(props.links ?? [], "DOWN");
  return {
    backgroundColor: "transparent",
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: ["55%", "80%"],
        avoidLabelOverlap: true,
        label: { color: "#cfe0ff", formatter: "{b}\n{c}" },
        labelLine: { length: 10, length2: 8 },
        data: [
          { name: "OK", value: ok, itemStyle: { color: "#2ee59d" } },
          { name: "DEGRADED", value: deg, itemStyle: { color: "#ffd166" } },
          { name: "DOWN", value: down, itemStyle: { color: "#ff4d6d" } }
        ]
      }
    ]
  };
});

const optBizOk = computed(() => {
  const b0 = bizMap.value.get("video");
  const b1 = bizMap.value.get("voice");
  const b2 = bizMap.value.get("text_image");
  const data = [
    { name: "视频", v: (b0?.okRatio ?? 0) * 100 },
    { name: "语音", v: (b1?.okRatio ?? 0) * 100 },
    { name: "文本/图像", v: (b2?.okRatio ?? 0) * 100 }
  ];
  return {
    backgroundColor: "transparent",
    grid: { left: 40, right: 18, top: 18, bottom: 28 },
    xAxis: {
      type: "value",
      max: 100,
      axisLabel: { color: "#9db5ff" },
      splitLine: { lineStyle: { color: "rgba(120,150,255,.18)" } }
    },
    yAxis: {
      type: "category",
      data: data.map(x => x.name),
      axisLabel: { color: "#cfe0ff" }
    },
    series: [
      {
        type: "bar",
        data: data.map(x => ({
          value: x.v,
          itemStyle: {
            color:
              x.name === "视频"
                ? "#ff7a59"
                : x.name === "语音"
                ? "#6ee7ff"
                : "#b8f7d4"
          }
        })),
        barWidth: 14
      }
    ]
  };
});

const optVideoTrend = computed(() => {
  // 只用当前值做一个“条形+阈值线”的简洁图（避免你再引入采样序列）
  const stall = Number(vStall.value);
  const ok = Number(vOk.value);
  return {
    backgroundColor: "transparent",
    grid: { left: 40, right: 18, top: 18, bottom: 28 },
    xAxis: {
      type: "category",
      data: ["Stall/min", "OK%"],
      axisLabel: { color: "#cfe0ff" }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#9db5ff" },
      splitLine: { lineStyle: { color: "rgba(120,150,255,.18)" } }
    },
    series: [
      {
        type: "bar",
        data: [
          { value: stall, itemStyle: { color: "#ffd166" } },
          { value: ok, itemStyle: { color: "#2ee59d" } }
        ],
        barWidth: 18
      }
    ],
    // 简单阈值提示：stall>6 视为明显卡顿
    graphic:
      stall > 6
        ? [
            {
              type: "text",
              left: "center",
              top: 6,
              style: {
                text: "卡顿显著（>6/min）",
                fill: "#ff4d6d",
                font: "12px sans-serif"
              }
            }
          ]
        : []
  };
});
</script>

<style scoped>
.sGrid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
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
}
.badge.blue {
  background: rgba(90, 130, 255, 0.18);
}
.badge.red {
  background: rgba(255, 90, 120, 0.14);
}
.badge.warn {
  background: rgba(255, 209, 102, 0.14);
}
.krow {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.kpi {
  flex: 1;
  min-width: 90px;
  background: rgba(10, 16, 32, 0.55);
  border: 1px solid rgba(120, 150, 255, 0.18);
  border-radius: 10px;
  padding: 8px;
}
.k {
  font-size: 12px;
  opacity: 0.85;
}
.v {
  display: block;
  font-size: 14px;
  margin-top: 4px;
}
.bad {
  color: #ff4d6d;
}
.warn {
  color: #ffd166;
}
.timeline {
  max-height: 260px;
  overflow: auto;
  margin-top: 10px;
}
.evt {
  display: grid;
  grid-template-columns: 70px 70px 1fr;
  gap: 8px;
  align-items: start;
  padding: 6px 8px;
  border: 1px solid rgba(120, 150, 255, 0.12);
  border-radius: 10px;
  margin-top: 8px;
  background: rgba(8, 12, 24, 0.45);
}
.tag {
  opacity: 0.95;
}
.msg {
  opacity: 0.92;
}
.btn2 {
  background: rgba(90, 130, 255, 0.18);
  border: 1px solid rgba(120, 150, 255, 0.25);
  color: #cfe0ff;
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
}
</style>
