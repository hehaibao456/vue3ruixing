import type { BlueConfig, RedConfig, LinkKPI, BizKPI } from "../sim/types";

export interface Sample {
  tMs: number;
  links: LinkKPI[];
  biz: BizKPI[];
}

export interface ReportInput {
  red: RedConfig;
  blue: BlueConfig;
  samples: Sample[];
  events: { tMs: number; type: string; msg: string }[];
}

type Trend = "high" | "low";

interface MetricRow {
  id: string;
  name: string;
  weight: number;
  unit: string;
  value: number;
  score: number;
  trend: Trend;
  range: [number, number];
}

interface Section {
  id: string;
  name: string;
  weight: number;
  score: number;
  items: MetricRow[];
}

interface Block {
  id: string;
  name: string;
  weight: number;
  score: number;
  sections: Section[];
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function mean(arr: number[], fallback = 0) {
  if (!arr.length) return fallback;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function scoreHigh(value: number, min: number, max: number, weight: number) {
  if (weight <= 0) return 0;
  const ratio = clamp((value - min) / Math.max(max - min, 1e-6), 0, 1);
  return weight * ratio;
}

function scoreLow(value: number, best: number, worst: number, weight: number) {
  if (weight <= 0) return 0;
  const ratio = clamp((worst - value) / Math.max(worst - best, 1e-6), 0, 1);
  return weight * ratio;
}

function formatValue(value: number, unit: string) {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "Mbps") return `${value.toFixed(1)} Mbps`;
  if (unit === "ms") return `${value.toFixed(0)} ms`;
  if (unit === "min") return `${value.toFixed(1)} min`;
  if (unit === "km") return `${value.toFixed(1)} km`;
  if (unit === "km/h") return `${value.toFixed(1)} km/h`;
  if (unit === "队") return `${value.toFixed(0)} 队`;
  if (unit === "次") return `${value.toFixed(1)}`;
  return `${value.toFixed(2)} ${unit}`.trim();
}

function scoreLevel(score: number, weight: number) {
  if (weight <= 0) return "neutral";
  const ratio = score / weight;
  if (ratio >= 0.85) return "good";
  if (ratio >= 0.7) return "warn";
  return "bad";
}

function toFixed1(v: number) {
  return Math.round(v * 10) / 10;
}

function haversineKm(a: { lon: number; lat: number }, b: { lon: number; lat: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function linkStats(samples: Sample[], linkId: string, fallback: LinkKPI) {
  const l = samples
    .map(s => s.links.find(x => x.linkId === linkId))
    .filter(Boolean) as LinkKPI[];
  const thr = l.map(x => x.throughputMbps);
  const lat = l.map(x => x.latencyMs);
  const loss = l.map(x => x.loss);
  const jitter = l.map(x => x.jitterMs);
  const ok = l.filter(x => x.status !== "DOWN").length;
  const total = l.length || 1;
  return {
    thrMean: mean(thr, fallback.throughputMbps),
    latMean: mean(lat, fallback.latencyMs),
    lossMean: mean(loss, fallback.loss),
    jitterMean: mean(jitter, fallback.jitterMs),
    avail: ok / total,
    downRatio: 1 - ok / total
  };
}

function bizStats(samples: Sample[], biz: BizKPI["biz"], fallback: BizKPI) {
  const list = samples
    .map(s => s.biz.find(x => x.biz === biz))
    .filter(Boolean) as BizKPI[];
  const ok = list.map(x => x.okRatio);
  const stall = list.map(x => x.stallPerMin);
  const p95 = list.map(x => x.p95LatencyMs);
  const allocRatio = list.map(x =>
    clamp(x.allocMbps / Math.max(x.demandMbps, 1e-6), 0, 1)
  );
  return {
    okMean: mean(ok, fallback.okRatio),
    stallMean: mean(stall, fallback.stallPerMin),
    p95Mean: mean(p95, fallback.p95LatencyMs),
    allocRatioMean: mean(allocRatio, clamp(fallback.allocMbps / fallback.demandMbps, 0, 1))
  };
}

function buildEvaluation(input: ReportInput) {
  const { red, blue, samples, events } = input;
  const blueAny = blue as unknown as {
    intensity?: number;
    shipJammer?: { intensity?: number };
    uavJammer?: { intensity?: number };
    teamJammer?: { intensity?: number };
  };

  const jammerIntensities = [
    blueAny.shipJammer?.intensity,
    blueAny.uavJammer?.intensity,
    blueAny.teamJammer?.intensity
  ].filter((v): v is number => typeof v === "number");

  const blueIntensity =
    typeof blueAny.intensity === "number"
      ? blueAny.intensity
      : mean(jammerIntensities, 0.45);

  const baseLink: LinkKPI = {
    linkId: "L01",
    type: "ship_to_fw_uav",
    from: "",
    to: "",
    snrDb: 14,
    ber: 0.0001,
    loss: clamp(0.02 + blueIntensity * 0.06, 0.01, 0.2),
    throughputMbps: clamp(70 - blueIntensity * 18, 35, 85),
    latencyMs: clamp(80 + blueIntensity * 55, 40, 260),
    jitterMs: clamp(30 + blueIntensity * 60, 12, 160),
    status: "OK"
  };

  const baseBiz = (biz: BizKPI["biz"]): BizKPI => ({
    biz,
    okRatio: clamp(0.85 - blueIntensity * 0.18, 0.55, 0.95),
    effectiveMbps: 12,
    allocMbps: 15,
    demandMbps: 20,
    p95LatencyMs: clamp(260 + blueIntensity * 180, 160, 720),
    stallPerMin: clamp(1.5 + blueIntensity * 4, 0.5, 8),
    status: "OK"
  });

  const l01 = linkStats(samples, "L01", baseLink);
  const l02 = linkStats(samples, "L02", {
    ...baseLink,
    linkId: "L02",
    throughputMbps: clamp(baseLink.throughputMbps - 10, 25, 70),
    latencyMs: clamp(baseLink.latencyMs + 10, 50, 280)
  });

  const video = bizStats(samples, "video", baseBiz("video"));
  const voice = bizStats(samples, "voice", baseBiz("voice"));
  const text = bizStats(samples, "text_image", baseBiz("text_image"));

  let interruptions = 0;
  let prevDown = false;
  for (const s of samples) {
    const L01 = s.links.find(x => x.linkId === "L01");
    const L02 = s.links.find(x => x.linkId === "L02");
    const nowDown = L01?.status === "DOWN" || L02?.status === "DOWN";
    if (!prevDown && nowDown) interruptions += 1;
    prevDown = nowDown;
  }

  const durationSec = samples.length
    ? (samples[samples.length - 1].tMs - samples[0].tMs) / 1000
    : red.durationMin * 60;

  const availability = clamp(1 - mean([l01.downRatio, l02.downRatio]), 0, 1);
  const coverageRate = availability * 100;
  const importantRate = l01.avail * 100;
  const blindRate = (1 - availability) * 100;

  const transmissionMbps = mean([l01.thrMean, l02.thrMean], baseLink.throughputMbps);
  const latencyMs = mean([l01.latMean, l02.latMean], baseLink.latencyMs);
  const linkReliability = (1 - mean([l01.lossMean, l02.lossMean])) * 100;

  const bizAvailability = mean([video.okMean, voice.okMean, text.okMean]) * 100;
  const bizGuarantee = video.okMean * 100;
  const userBearing = mean([video.allocRatioMean, voice.allocRatioMean, text.allocRatioMean]) * 100;

  const interruptionRate = interruptions / Math.max(durationSec / 60, 1);
  const interop = clamp(100 - interruptionRate * 7, 60, 99);
  const heteroCompat = clamp(100 - mean([l01.jitterMean, l02.jitterMean]) / 6, 60, 99);
  const fusion = clamp((transmissionMbps / 120) * 100, 55, 98);

  const distanceKm = haversineKm(red.teamsStart, red.teamsGoal);
  const avgSpeedKmh = clamp(distanceKm / Math.max(red.durationMin / 60, 0.1), 8, 55);
  const deployTimeMin = clamp(18 - avgSpeedKmh * 0.25 + blueIntensity * 6, 6, 26);
  const netSetupMin = clamp(9 + blueIntensity * 6 - avgSpeedKmh * 0.08, 3, 18);
  const moveSuccess = clamp(availability * 100 - blueIntensity * 8, 70, 98);
  const netScale = clamp(red.teamCount, 6, 18);
  const netStability = clamp(100 - l01.lossMean * 180 - interruptionRate * 4, 65, 98);
  const moveQuality = clamp(100 - latencyMs / 7 - l01.lossMean * 120, 60, 97);
  const moveRange = clamp(red.rwUavRangeKm + red.fwUavRangeKm, 2, 8);

  const recoveryTime = clamp(1.2 + interruptions * 0.4 + l01.lossMean * 8, 0.6, 6);
  const reconfigSuccess = clamp(100 - interruptionRate * 8, 70, 98);
  const techSupport = clamp(86 + red.teamCount * 0.6, 86, 98);
  const spareParts = clamp(88 + (1 - blueIntensity) * 6, 85, 98);
  const antiJam = clamp(100 * (1 - blueIntensity * 0.55) * (1 - l01.lossMean * 0.5), 60, 97);
  const antiSpoof = clamp(92 - latencyMs / 12, 60, 96);
  const physicalSurvive = clamp(90 - blueIntensity * 8, 70, 95);
  const secrecyReliability = clamp(90 + (1 - l01.lossMean) * 6, 86, 98);
  const cyberDefense = clamp(88 + (1 - interruptionRate / 6) * 8, 80, 97);

  const battlefieldMobility = clamp(70 + avgSpeedKmh * 0.6, 70, 98);
  const battlefieldComm = clamp(availability * 100, 70, 98);
  const hotAdapt = clamp(84 + (1 - blueIntensity) * 8, 70, 96);
  const coldAdapt = clamp(83 + (1 - blueIntensity) * 7, 70, 95);
  const humidAdapt = clamp(82 + (1 - blueIntensity) * 7, 70, 95);
  const seismic = clamp(86 + (1 - blueIntensity) * 6, 70, 95);
  const sand = clamp(85 + (1 - blueIntensity) * 6, 70, 95);
  const rain = clamp(84 + (1 - blueIntensity) * 6, 70, 95);
  const supply = clamp(86 + red.teamCount * 0.4, 80, 96);
  const energy = clamp(85 + (1 - blueIntensity) * 5, 80, 95);

  const strategyScore =
    red.strategy === "fhss"
      ? 91
      : red.strategy === "power_control"
      ? 89
      : red.strategy === "reconfig_route"
      ? 93
      : 86;
  const experience = clamp(82 + samples.length / 120, 82, 95);
  const decisionAccuracy = clamp(78 + bizAvailability * 0.2, 80, 96);
  const decisionTimeliness = clamp(92 - red.dtMs / 40, 70, 95);
  const faultEfficiency = clamp(95 - recoveryTime * 4, 70, 96);
  const maintenance = clamp(88 + linkReliability * 0.08, 80, 96);

  const blocks: Block[] = [
    {
      id: "B1",
      name: "基础通信能力",
      weight: 70,
      score: 0,
      sections: [
        {
          id: "C11",
          name: "网络覆盖能力",
          weight: 18,
          score: 0,
          items: [
            { id: "D111", name: "作战区域覆盖率", weight: 7, unit: "%", value: coverageRate, trend: "high", range: [70, 98], score: 0 },
            { id: "D112", name: "重要方向覆盖率", weight: 7, unit: "%", value: importantRate, trend: "high", range: [72, 99], score: 0 },
            { id: "D113", name: "通信盲区率", weight: 4, unit: "%", value: blindRate, trend: "low", range: [2, 15], score: 0 }
          ]
        },
        {
          id: "C12",
          name: "系统传输能力",
          weight: 18,
          score: 0,
          items: [
            { id: "D121", name: "传输速率", weight: 7, unit: "Mbps", value: transmissionMbps, trend: "high", range: [40, 120], score: 0 },
            { id: "D122", name: "传输时延", weight: 6, unit: "ms", value: latencyMs, trend: "low", range: [35, 180], score: 0 },
            { id: "D123", name: "系统链路可靠性", weight: 5, unit: "%", value: linkReliability, trend: "high", range: [85, 99], score: 0 }
          ]
        },
        {
          id: "C13",
          name: "业务保障能力",
          weight: 24,
          score: 0,
          items: [
            { id: "D131", name: "业务可用率", weight: 8, unit: "%", value: bizAvailability, trend: "high", range: [75, 98], score: 0 },
            { id: "D132", name: "业务保障率（高优先级达标比例）", weight: 10, unit: "%", value: bizGuarantee, trend: "high", range: [75, 98], score: 0 },
            { id: "D133", name: "用户承载率（并发承载/拥塞保持）", weight: 6, unit: "%", value: userBearing, trend: "high", range: [70, 98], score: 0 }
          ]
        },
        {
          id: "C14",
          name: "协同通信能力",
          weight: 10,
          score: 0,
          items: [
            { id: "D141", name: "互联互通能力", weight: 4, unit: "%", value: interop, trend: "high", range: [70, 98], score: 0 },
            { id: "D142", name: "异构系统兼容率", weight: 3, unit: "%", value: heteroCompat, trend: "high", range: [70, 98], score: 0 },
            { id: "D143", name: "系统融合度", weight: 3, unit: "%", value: fusion, trend: "high", range: [70, 98], score: 0 }
          ]
        }
      ]
    },
    {
      id: "B2",
      name: "机动部署能力",
      weight: 10,
      score: 0,
      sections: [
        {
          id: "C21",
          name: "转移部署能力",
          weight: 5,
          score: 0,
          items: [
            { id: "D211", name: "机动转移速度", weight: 2, unit: "km/h", value: avgSpeedKmh, trend: "high", range: [12, 40], score: 0 },
            { id: "D212", name: "展开/撤收时间", weight: 2, unit: "min", value: deployTimeMin, trend: "low", range: [6, 20], score: 0 },
            { id: "D213", name: "机动成功率", weight: 1, unit: "%", value: moveSuccess, trend: "high", range: [75, 98], score: 0 }
          ]
        },
        {
          id: "C22",
          name: "高效组网能力",
          weight: 3,
          score: 0,
          items: [
            { id: "D221", name: "组网时间", weight: 1, unit: "min", value: netSetupMin, trend: "low", range: [3, 12], score: 0 },
            { id: "D222", name: "网络规模", weight: 1, unit: "队", value: netScale, trend: "high", range: [6, 16], score: 0 },
            { id: "D223", name: "网络稳定性", weight: 1, unit: "%", value: netStability, trend: "high", range: [75, 98], score: 0 }
          ]
        },
        {
          id: "C23",
          name: "动中通信能力",
          weight: 2,
          score: 0,
          items: [
            { id: "D231", name: "动中通信成功率", weight: 1, unit: "%", value: availability * 100, trend: "high", range: [75, 98], score: 0 },
            { id: "D232", name: "动中通信质量", weight: 1, unit: "%", value: moveQuality, trend: "high", range: [70, 97], score: 0 },
            { id: "D233", name: "动中通信覆盖范围", weight: 0, unit: "km", value: moveRange, trend: "high", range: [2, 8], score: 0 }
          ]
        }
      ]
    },
    {
      id: "B3",
      name: "系统抗毁能力",
      weight: 10,
      score: 0,
      sections: [
        {
          id: "C31",
          name: "网络接替能力",
          weight: 2,
          score: 0,
          items: [
            { id: "D311", name: "业务恢复时间", weight: 1, unit: "min", value: recoveryTime, trend: "low", range: [0.8, 4.5], score: 0 },
            { id: "D312", name: "网络重构成功率", weight: 1, unit: "%", value: reconfigSuccess, trend: "high", range: [75, 98], score: 0 }
          ]
        },
        {
          id: "C32",
          name: "装备保障能力",
          weight: 2,
          score: 0,
          items: [
            { id: "D321", name: "技术人员保障率", weight: 1, unit: "%", value: techSupport, trend: "high", range: [85, 98], score: 0 },
            { id: "D322", name: "备品备件满足率", weight: 1, unit: "%", value: spareParts, trend: "high", range: [85, 98], score: 0 }
          ]
        },
        {
          id: "C33",
          name: "电磁防护能力",
          weight: 3,
          score: 0,
          items: [
            { id: "D331", name: "抗干扰能力", weight: 2, unit: "%", value: antiJam, trend: "high", range: [70, 97], score: 0 },
            { id: "D332", name: "抗欺骗能力", weight: 1, unit: "%", value: antiSpoof, trend: "high", range: [70, 96], score: 0 }
          ]
        },
        {
          id: "C34",
          name: "物理防护能力",
          weight: 1,
          score: 0,
          items: [
            { id: "D341", name: "抗毁伤能力", weight: 1, unit: "%", value: physicalSurvive, trend: "high", range: [70, 95], score: 0 },
            { id: "D342", name: "抗冲击能力", weight: 0, unit: "%", value: physicalSurvive, trend: "high", range: [70, 95], score: 0 }
          ]
        },
        {
          id: "C35",
          name: "安全保密能力",
          weight: 2,
          score: 0,
          items: [
            { id: "D351", name: "保密系统可靠率", weight: 1, unit: "%", value: secrecyReliability, trend: "high", range: [85, 98], score: 0 },
            { id: "D352", name: "网络安全防护能力", weight: 1, unit: "%", value: cyberDefense, trend: "high", range: [80, 97], score: 0 }
          ]
        }
      ]
    },
    {
      id: "B4",
      name: "环境适应能力",
      weight: 5,
      score: 0,
      sections: [
        {
          id: "C41",
          name: "战场环境适应能力",
          weight: 2,
          score: 0,
          items: [
            { id: "D411", name: "战场机动适应率", weight: 1, unit: "%", value: battlefieldMobility, trend: "high", range: [75, 98], score: 0 },
            { id: "D412", name: "战场通信保持率", weight: 1, unit: "%", value: battlefieldComm, trend: "high", range: [75, 98], score: 0 }
          ]
        },
        {
          id: "C42",
          name: "自然环境适应能力",
          weight: 1,
          score: 0,
          items: [
            { id: "D421", name: "高温适应能力", weight: 0.4, unit: "%", value: hotAdapt, trend: "high", range: [75, 96], score: 0 },
            { id: "D422", name: "低温适应能力", weight: 0.3, unit: "%", value: coldAdapt, trend: "high", range: [75, 95], score: 0 },
            { id: "D423", name: "潮湿适应能力", weight: 0.3, unit: "%", value: humidAdapt, trend: "high", range: [75, 95], score: 0 }
          ]
        },
        {
          id: "C43",
          name: "装备环境适应能力",
          weight: 1,
          score: 0,
          items: [
            { id: "D431", name: "抗震性能", weight: 0.4, unit: "%", value: seismic, trend: "high", range: [75, 95], score: 0 },
            { id: "D432", name: "抗沙尘性能", weight: 0.3, unit: "%", value: sand, trend: "high", range: [75, 95], score: 0 },
            { id: "D433", name: "抗雨雪性能", weight: 0.3, unit: "%", value: rain, trend: "high", range: [75, 95], score: 0 }
          ]
        },
        {
          id: "C44",
          name: "后勤保障能力",
          weight: 1,
          score: 0,
          items: [
            { id: "D441", name: "物资补给能力", weight: 0.5, unit: "%", value: supply, trend: "high", range: [80, 96], score: 0 },
            { id: "D442", name: "能源保障能力", weight: 0.5, unit: "%", value: energy, trend: "high", range: [80, 95], score: 0 }
          ]
        }
      ]
    },
    {
      id: "B5",
      name: "指控人员能力",
      weight: 5,
      score: 0,
      sections: [
        {
          id: "C51",
          name: "人员素质",
          weight: 2,
          score: 0,
          items: [
            { id: "D511", name: "专业技术水平", weight: 1, unit: "%", value: strategyScore, trend: "high", range: [80, 95], score: 0 },
            { id: "D512", name: "实战经验水平", weight: 1, unit: "%", value: experience, trend: "high", range: [80, 95], score: 0 }
          ]
        },
        {
          id: "C52",
          name: "指挥决策能力",
          weight: 2,
          score: 0,
          items: [
            { id: "D521", name: "决策正确率", weight: 1, unit: "%", value: decisionAccuracy, trend: "high", range: [80, 96], score: 0 },
            { id: "D522", name: "决策时效性", weight: 1, unit: "%", value: decisionTimeliness, trend: "high", range: [70, 95], score: 0 }
          ]
        },
        {
          id: "C53",
          name: "技术保障能力",
          weight: 1,
          score: 0,
          items: [
            { id: "D531", name: "故障排除效率", weight: 0.5, unit: "%", value: faultEfficiency, trend: "high", range: [70, 96], score: 0 },
            { id: "D532", name: "系统维护能力", weight: 0.5, unit: "%", value: maintenance, trend: "high", range: [80, 96], score: 0 }
          ]
        }
      ]
    }
  ];

  for (const block of blocks) {
    let blockScore = 0;
    for (const section of block.sections) {
      let sectionScore = 0;
      for (const item of section.items) {
        item.score =
          item.trend === "high"
            ? scoreHigh(item.value, item.range[0], item.range[1], item.weight)
            : scoreLow(item.value, item.range[0], item.range[1], item.weight);
        sectionScore += item.score;
      }
      section.score = toFixed1(sectionScore);
      blockScore += sectionScore;
    }
    block.score = toFixed1(blockScore);
  }

  const totalScore = toFixed1(blocks.reduce((a, b) => a + b.score, 0));
  const grade =
    totalScore >= 90 ? "优秀" : totalScore >= 80 ? "良好" : totalScore >= 70 ? "合格" : "需提升";

  const allItems: MetricRow[] = blocks.flatMap(b => b.sections.flatMap(s => s.items));
  const sorted = [...allItems].filter(x => x.weight > 0);
  sorted.sort((a, b) => b.score / b.weight - a.score / a.weight);
  const strengths = sorted.slice(0, 3);
  const risks = [...sorted].reverse().slice(0, 3);

  const lastEvents = events.slice(-120);

  return {
    blocks,
    totalScore,
    grade,
    strengths,
    risks,
    durationSec,
    samplesCount: samples.length,
    l01,
    l02,
    video,
    voice,
    text,
    availability,
    interruptions,
    distanceKm,
    avgSpeedKmh,
    lastEvents
  };
}

function buildRingSvg(score: number) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const ratio = clamp(score / 100, 0, 1);
  const dash = `${(circumference * ratio).toFixed(1)} ${circumference.toFixed(1)}`;
  return `
<svg viewBox="0 0 140 140" class="ring">
  <defs>
    <linearGradient id="ringGrad" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#49f1c3"/>
      <stop offset="100%" stop-color="#4c74ff"/>
    </linearGradient>
  </defs>
  <circle cx="70" cy="70" r="${radius}" stroke="rgba(255,255,255,0.12)" stroke-width="10" fill="none"/>
  <circle cx="70" cy="70" r="${radius}" stroke="url(#ringGrad)" stroke-width="10" fill="none"
    stroke-linecap="round" stroke-dasharray="${dash}" transform="rotate(-90 70 70)"/>
  <text x="70" y="66" text-anchor="middle" class="ringScore">${score.toFixed(1)}</text>
  <text x="70" y="88" text-anchor="middle" class="ringLabel">综合得分</text>
</svg>`;
}

function buildRadarSvg(blocks: Block[]) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 95;
  const count = blocks.length;
  const points = blocks
    .map((b, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const ratio = clamp(b.score / Math.max(b.weight, 1), 0, 1);
      const r = radius * ratio;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const labels = blocks
    .map((b, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const r = radius + 22;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" class="radarLabel">${escapeHtml(
        b.id
      )}</text>`;
    })
    .join("");

  return `
<svg viewBox="0 0 ${size} ${size}" class="radar">
  <polygon points="${points}" fill="rgba(76,116,255,0.22)" stroke="#64d9ff" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.1)"/>
  <circle cx="${cx}" cy="${cy}" r="${radius * 0.66}" fill="none" stroke="rgba(255,255,255,0.08)"/>
  <circle cx="${cx}" cy="${cy}" r="${radius * 0.33}" fill="none" stroke="rgba(255,255,255,0.06)"/>
  ${labels}
</svg>`;
}

function iconFor(id: string) {
  const icons: Record<string, string> = {
    B1: "📡",
    B2: "🚀",
    B3: "🛡️",
    B4: "🌦️",
    B5: "🧭"
  };
  return icons[id] ?? "⭐";
}

export function buildReportHtml(input: ReportInput) {
  const report = buildEvaluation(input);
  const now = new Date();
  const ringSvg = buildRingSvg(report.totalScore);
  const radarSvg = buildRadarSvg(report.blocks);

  const bCards = report.blocks
    .map(b => {
      const ratio = clamp(b.score / Math.max(b.weight, 1), 0, 1);
      return `
      <div class="bCard">
        <div class="bHeader">
          <div class="bIcon">${iconFor(b.id)}</div>
          <div class="bTitle">${escapeHtml(b.id)} ${escapeHtml(b.name)}</div>
          <div class="bScore">${b.score.toFixed(1)} / ${b.weight}</div>
        </div>
        <div class="bar">
          <span style="width:${(ratio * 100).toFixed(1)}%"></span>
        </div>
      </div>`;
    })
    .join("");

  const strengthItems = report.strengths
    .map(
      s =>
        `<li><span class="dot good"></span>${escapeHtml(s.id)} ${escapeHtml(
          s.name
        )} · ${formatValue(s.value, s.unit)}</li>`
    )
    .join("");

  const riskItems = report.risks
    .map(
      s =>
        `<li><span class="dot warn"></span>${escapeHtml(s.id)} ${escapeHtml(
          s.name
        )} · ${formatValue(s.value, s.unit)}</li>`
    )
    .join("");

  const detailBlocks = report.blocks
    .map(b => {
      const sections = b.sections
        .map(s => {
          const rows = s.items
            .map(d => {
              const level = scoreLevel(d.score, d.weight);
              return `<tr>
                <td class="mono">${escapeHtml(d.id)}</td>
                <td>${escapeHtml(d.name)}</td>
                <td>${formatValue(d.value, d.unit)}</td>
                <td>${d.weight}</td>
                <td><span class="pill ${level}">${d.score.toFixed(1)}</span></td>
              </tr>`;
            })
            .join("");

          return `
          <div class="subCard">
            <div class="subHead">
              <div>${escapeHtml(s.id)} ${escapeHtml(s.name)}</div>
              <div class="subScore">小计 ${s.score.toFixed(1)} / ${s.weight}</div>
            </div>
            <table class="detailTable">
              <thead>
                <tr><th>指标</th><th>名称</th><th>结果</th><th>分值</th><th>得分</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;
        })
        .join("");

      return `
      <section class="block">
        <div class="blockHead">
          <div class="blockIcon">${iconFor(b.id)}</div>
          <div>
            <div class="blockTitle">${escapeHtml(b.id)} ${escapeHtml(b.name)}</div>
            <div class="blockMeta">得分 ${b.score.toFixed(1)} / ${b.weight}</div>
          </div>
        </div>
        ${sections}
      </section>`;
    })
    .join("");

  const eventRows = report.lastEvents
    .map(
      e =>
        `<tr><td class="mono">${(e.tMs / 1000).toFixed(1)}</td><td>${escapeHtml(
          e.type
        )}</td><td>${escapeHtml(e.msg)}</td></tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>通信系统综合评估报告</title>
<style>
  :root{
    --bg0:#0b1020;
    --bg1:#121a2f;
    --card:#141f3a;
    --txt:#e6f0ff;
    --muted:#a7b4d4;
    --accent:#64d9ff;
    --accent2:#6a8bff;
    --ok:#33f0a0;
    --warn:#ffd16a;
    --bad:#ff6b7a;
  }
  *{box-sizing:border-box}
  body{
    margin:0;
    color:var(--txt);
    background:
      radial-gradient(1200px 600px at 15% -10%, rgba(76,116,255,0.28), transparent 60%),
      radial-gradient(900px 500px at 90% 0%, rgba(100,217,255,0.18), transparent 55%),
      var(--bg0);
    font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif;
  }
  .page{padding:32px 36px 60px 36px; max-width:1200px; margin:0 auto;}
  .hero{
    display:grid;
    grid-template-columns: 1.2fr 1fr;
    gap:24px;
    background:linear-gradient(135deg, rgba(20,31,58,0.95), rgba(10,16,32,0.95));
    border:1px solid rgba(120,150,255,0.2);
    border-radius:18px;
    padding:24px;
    position:relative;
    overflow:hidden;
  }
  .hero::after{
    content:"";
    position:absolute;
    right:-80px;
    top:-80px;
    width:220px;
    height:220px;
    border-radius:50%;
    background:radial-gradient(circle, rgba(100,217,255,0.35), transparent 70%);
  }
  h1{margin:0 0 6px 0;font-size:28px;letter-spacing:1px}
  .meta{color:var(--muted);font-size:13px;line-height:1.7}
  .badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(100,217,255,0.12);border:1px solid rgba(100,217,255,0.35);font-size:12px;}
  .scoreWrap{display:flex;gap:16px;align-items:center;justify-content:flex-end;}
  .ringScore{fill:var(--txt);font-size:22px;font-weight:700}
  .ringLabel{fill:var(--muted);font-size:12px}
  .radar{width:100%;max-width:260px}
  .radarLabel{fill:var(--muted);font-size:11px}
  .grid{display:grid;gap:16px}
  .grid.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
  .grid.cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
  .card{
    background:var(--card);
    border:1px solid rgba(120,150,255,0.18);
    border-radius:14px;
    padding:16px;
  }
  .bCard{background:rgba(18,26,47,0.8);border:1px solid rgba(120,150,255,0.18);border-radius:12px;padding:12px;}
  .bHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .bIcon{font-size:22px}
  .bTitle{font-weight:700}
  .bScore{color:var(--muted);font-size:12px}
  .bar{height:8px;border-radius:8px;background:rgba(255,255,255,0.08);margin-top:10px;overflow:hidden;}
  .bar span{display:block;height:100%;background:linear-gradient(90deg,#35f2b1,#6a8bff);}
  .statList{margin:0;padding:0;list-style:none;display:grid;gap:8px}
  .statList li{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)}
  .dot{width:8px;height:8px;border-radius:999px;display:inline-block}
  .dot.good{background:var(--ok)}
  .dot.warn{background:var(--warn)}
  .pill{padding:2px 8px;border-radius:999px;font-size:12px;background:rgba(255,255,255,0.08);display:inline-block}
  .pill.good{background:rgba(51,240,160,0.15);color:var(--ok)}
  .pill.warn{background:rgba(255,209,106,0.15);color:var(--warn)}
  .pill.bad{background:rgba(255,107,122,0.15);color:var(--bad)}
  .block{margin-top:24px}
  .blockHead{display:flex;align-items:center;gap:12px;margin-bottom:12px}
  .blockIcon{font-size:24px}
  .blockTitle{font-size:18px;font-weight:700}
  .blockMeta{color:var(--muted);font-size:12px}
  .subCard{background:rgba(10,16,30,0.7);border:1px solid rgba(120,150,255,0.15);border-radius:12px;padding:12px;margin-top:12px}
  .subHead{display:flex;align-items:center;justify-content:space-between;font-weight:600;margin-bottom:8px}
  .subScore{color:var(--muted);font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{padding:8px 6px;border-bottom:1px solid rgba(120,150,255,0.15);text-align:left}
  th{color:var(--muted);font-weight:600}
  .mono{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace}
  .sectionTitle{font-size:16px;font-weight:700;margin-bottom:10px}
  .summaryGrid{display:grid;grid-template-columns:1.1fr 1fr;gap:18px;margin-top:18px}
  .mini{font-size:12px;color:var(--muted)}
  .events{max-height:260px;overflow:auto}
  .printHint{display:none}
  @media print{
    body{background:#fff;color:#111}
    .card,.hero,.bCard,.subCard{background:#fff;border-color:#ddd;color:#111}
    .bar span{background:#3b82f6}
    .printHint{display:block;color:#333;margin-top:6px}
  }
</style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div>
        <div class="badge">综合评估 · 体系能力</div>
        <h1>通信系统综合评估报告</h1>
        <div class="meta">
          生成时间：${now.toLocaleString()}<br/>
          评估时长：${(report.durationSec / 60).toFixed(1)} min · 采样点：${
    report.samplesCount
  }<br/>
          组网规模：${input.red.teamCount} 队 · 机动距离：${report.distanceKm.toFixed(
    1
  )} km · 平均速度：${report.avgSpeedKmh.toFixed(1)} km/h
        </div>
        <div class="printHint">打印或导出 PDF 时将自动优化排版</div>
      </div>
      <div class="scoreWrap">
        ${ringSvg}
        <div class="card">
          ${radarSvg}
          <div class="mini" style="text-align:center;margin-top:8px">B层能力分布</div>
        </div>
      </div>
    </section>

    <div class="summaryGrid">
      <div class="card">
        <div class="sectionTitle">B层评分概览</div>
        <div class="grid cols-2">${bCards}</div>
      </div>
      <div class="card">
        <div class="sectionTitle">评估要点</div>
        <div class="mini">优势项</div>
        <ul class="statList">${strengthItems}</ul>
        <div class="mini" style="margin-top:12px">关注项</div>
        <ul class="statList">${riskItems}</ul>
        <div class="badge" style="margin-top:12px">综合等级：${escapeHtml(
          report.grade
        )}</div>
      </div>
    </div>

    <section class="card" style="margin-top:20px">
      <div class="sectionTitle">关键运行指标</div>
      <div class="grid cols-3">
        <div class="bCard">
          <div class="mini">链路可靠性</div>
          <div class="bTitle">${(report.availability * 100).toFixed(1)}%</div>
          <div class="mini">中断次数：${report.interruptions}</div>
        </div>
        <div class="bCard">
          <div class="mini">L01 平均时延</div>
          <div class="bTitle">${report.l01.latMean.toFixed(0)} ms</div>
          <div class="mini">L01 吞吐：${report.l01.thrMean.toFixed(1)} Mbps</div>
        </div>
        <div class="bCard">
          <div class="mini">视频业务可用率</div>
          <div class="bTitle">${(report.video.okMean * 100).toFixed(1)}%</div>
          <div class="mini">P95 时延：${report.video.p95Mean.toFixed(0)} ms</div>
        </div>
      </div>
    </section>

    ${detailBlocks}

    <section class="card" style="margin-top:22px">
      <div class="sectionTitle">事件记录</div>
      <div class="events">
        <table>
          <thead><tr><th>t(s)</th><th>类型</th><th>内容</th></tr></thead>
          <tbody>${eventRows}</tbody>
        </table>
      </div>
    </section>
  </div>
</body>
</html>`;

  return html;
}
