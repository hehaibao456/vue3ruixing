<template>
  <div class="kpiGrid">
    <div class="card">
      <div class="title">注入状态</div>
      <div class="small mono" v-if="!injection.active">无（未注入）</div>
      <div class="small mono" v-else>
        kind={{ injection.kind }} · remaining={{
          Math.max(
            0,
            (injection.untilMs - events.at(-1)?.tMs || 0) / 1000
          ).toFixed(1)
        }}s
      </div>
    </div>
    <div class="card">
      <div class="title">链路通畅情况（关键链路 + 小组摘要）</div>

      <div v-if="!links?.length" class="small">未启动或暂无数据</div>

      <div v-else>
        <div class="card">
          <div class="title">上游链路</div>
          <div
            v-for="l in upstream"
            :key="l.linkId"
            class="card"
            style="margin-top: 10px"
          >
            <div class="row" style="justify-content: space-between">
              <div class="mono">
                <b>{{ l.linkId }}</b>
                {{ l.from }} → {{ l.to }}
              </div>
              <div :class="cls(l.status)" class="mono">
                <b>{{ l.status }}</b>
              </div>
            </div>
            <div class="small mono">
              SNR={{ l.snrDb.toFixed(1) }}dB · BER={{ sci(l.ber) }} · LOSS={{
                (l.loss * 100).toFixed(1)
              }}%
            </div>
            <div class="small mono">
              THR={{ l.throughputMbps.toFixed(1) }}Mbps · LAT={{
                l.latencyMs.toFixed(0)
              }}ms · JIT={{ l.jitterMs.toFixed(0) }}ms
            </div>
          </div>
        </div>

        <div class="card" style="margin-top: 10px">
          <div class="title">到小组下行链路（每组取更优一条）</div>
          <div class="small">
            规则：比较 RW 与 FW 吞吐，取较大者作为该组“当前可用链路”
          </div>

          <div
            v-for="x in perTeamBest"
            :key="x.teamId"
            class="card"
            style="margin-top: 10px"
          >
            <div class="row" style="justify-content: space-between">
              <div class="mono">
                <b>{{ x.teamId }}</b>
                via {{ x.via }}
              </div>
              <div :class="cls(x.k.status)" class="mono">
                <b>{{ x.k.status }}</b>
              </div>
            </div>
            <div class="small mono">
              THR={{ x.k.throughputMbps.toFixed(1) }}Mbps · LOSS={{
                (x.k.loss * 100).toFixed(1)
              }}% · LAT={{ x.k.latencyMs.toFixed(0) }}ms
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="title">业务通畅情况（视频优先退化）</div>
      <div v-if="!biz?.length" class="small">未启动或暂无数据</div>
      <div v-for="b in biz" :key="b.biz" class="card" style="margin-top: 10px">
        <div class="row" style="justify-content: space-between">
          <div class="mono">
            <b>{{ bizName(b.biz) }}</b>
          </div>
          <div :class="cls(b.status)" class="mono">
            <b>{{ b.status }}</b>
          </div>
        </div>
        <div class="small mono">
          Alloc/Demand={{ b.allocMbps.toFixed(1) }}/{{
            b.demandMbps.toFixed(1)
          }}
          Mbps
        </div>
        <div class="small mono">
          OK={{ (b.okRatio * 100).toFixed(1) }}% · P95={{
            b.p95LatencyMs.toFixed(0)
          }}ms
        </div>
        <div class="small mono" v-if="b.biz === 'video'">
          Stall={{ b.stallPerMin.toFixed(1) }}/min
        </div>
      </div>
    </div>

    <EventTimeline :events="events" :max="30" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { BizKPI, LinkKPI } from "../sim/types";
import EventTimeline from "./EventTimeline.vue";

const props = defineProps<{
  links: LinkKPI[];
  biz: BizKPI[];
  events: { tMs: number; type: string; msg: string }[];
  injection: { kind: string; active: boolean; untilMs: number };
}>();

const upstream = computed(() =>
  props.links.filter(l => l.linkId === "L01" || l.linkId === "L02")
);

const perTeamBest = computed(() => {
  const teams = new Set<string>();
  for (const l of props.links) {
    if (l.linkId.startsWith("L-RW-")) teams.add(l.to);
    if (l.linkId.startsWith("L-FW-")) teams.add(l.to);
  }
  const ids = Array.from(teams).sort();

  return ids
    .map(teamId => {
      const rw = props.links.find(l => l.linkId === `L-RW-${teamId}`);
      const fw = props.links.find(l => l.linkId === `L-FW-${teamId}`);
      if (!rw && !fw) return null;
      const best =
        !fw || (rw && rw.throughputMbps >= fw.throughputMbps) ? rw! : fw!;
      const via = best.linkId.startsWith("L-RW-") ? "RW-UAV" : "FW-UAV";
      return { teamId, via, k: best };
    })
    .filter(Boolean) as { teamId: string; via: string; k: LinkKPI }[];
});

function cls(s: string) {
  return s === "OK" ? "ok" : s === "DEGRADED" ? "warn" : "bad";
}
function bizName(x: string) {
  if (x === "video") return "视频业务";
  if (x === "voice") return "语音业务";
  return "文本/图像业务";
}
function sci(v: number) {
  if (v === 0) return "0";
  const e = v.toExponential(2);
  return e.replace("+", "");
}
</script>
