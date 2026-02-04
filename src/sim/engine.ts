import type {
  BlueConfig,
  RedConfig,
  SimState,
  GeoPoint,
  LinkKPI,
  BizKPI
} from "./types";
import { computeStrategyGains } from "./strategy";
import type { InjectionState } from "./injection";
import { judgeBiz, judgeLink } from "./kpi";
import { haversineMeters, bearingDeg, angleDiffDeg } from "./geo";
import { allocateByDegradeOrder, type BizDemand } from "./scheduler";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function moveTowards(p: GeoPoint, goal: GeoPoint, stepT: number): GeoPoint {
  return {
    lon: lerp(p.lon, goal.lon, stepT),
    lat: lerp(p.lat, goal.lat, stepT),
    alt: lerp(p.alt, goal.alt, stepT)
  };
}
function randn(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function applyJamming(
  base: number,
  mode: BlueConfig[keyof BlueConfig],
  intensity: number
) {
  const modeFactor =
    mode === "none"
      ? 0
      : mode === "spot"
      ? 0.35
      : mode === "sweep"
      ? 0.55
      : 0.75;
  return base * (1 - modeFactor * intensity);
}

function applyRedStrategyRecovery(x: number, strategy: RedConfig["strategy"]) {
  const r =
    strategy === "baseline"
      ? 1.0
      : strategy === "fhss"
      ? 1.25
      : strategy === "power_control"
      ? 1.18
      : 1.35;
  return x * r;
}

export function initSim(red: RedConfig): SimState {
  const teams = Array.from({ length: red.teamCount }).map((_, i) => ({
    id: `T${String(i + 1).padStart(2, "0")}`,
    pos: {
      lon: red.teamsStart.lon + (i % 4) * 0.0012,
      lat: red.teamsStart.lat + Math.floor(i / 4) * 0.001,
      alt: 0
    }
  }));

  return {
    tMs: 0,
    running: false,
    ship: red.shipPos,
    rwUav: red.rwUavStart,
    fwUav: red.fwUavStart,
    teams,
    links: [],
    biz: [],
    events: [],
    injection: { kind: "none", untilMs: 0, active: false }
  };
}

// 覆盖/指向（示意）
function coverageFactorRw(distM: number, rangeKm: number) {
  const r = rangeKm * 1000;
  if (distM >= r) return 0;
  const f = 1 - 0.7 * (distM / r);
  return clamp(f, 0.25, 1.0);
}

function coverageFactorFw(
  uav: GeoPoint,
  team: GeoPoint,
  rangeKm: number,
  pointingDeg: number,
  beamDeg: number
) {
  const distM = haversineMeters(uav, team);
  const r = rangeKm * 1000;
  if (distM >= r) return { cov: 0, distM, offAxisDeg: 180 };

  const brg = bearingDeg(uav, team);
  const offAxis = angleDiffDeg(brg, pointingDeg);

  const half = beamDeg / 2;
  let dir = 1.0;
  if (offAxis <= half) {
    dir = clamp(1 - (offAxis / half) * 0.25, 0.75, 1.0);
  } else {
    const k = clamp((offAxis - half) / 90, 0, 1);
    dir = clamp(0.35 * (1 - 0.7 * k), 0.08, 0.35);
  }

  const dist = clamp(1 - 0.6 * (distM / r), 0.3, 1.0);
  return { cov: dir * dist, distM, offAxisDeg: offAxis };
}

function kpiFromFactor(
  linkId: string,
  type: LinkKPI["type"],
  from: string,
  to: string,
  baseThroughput: number,
  baseSNR: number,
  baseLatency: number,
  factor: number,
  noise: number,
  blockPenalty: number // 0..1
): LinkKPI {
  const snrDb = baseSNR * factor + noise;
  const ber = clamp(2e-6 / Math.max(factor, 0.05), 1e-7, 1e-1);
  const throughputMbps = clamp(baseThroughput * factor, 0, baseThroughput);
  const blockLatMul = 1 + blockPenalty * 8.0; // 阻塞：时延乘 1~9
  const blockJitMul = 1 + blockPenalty * 10.0; // 抖动乘 1~11
  const blockLossAdd = blockPenalty * 0.08; // 额外丢包（排队溢出）

  const loss = clamp(0.012 / Math.max(factor, 0.05) + blockLossAdd, 0, 0.95);
  const latencyMs = clamp(
    (baseLatency / Math.max(factor, 0.05)) * blockLatMul,
    20,
    5000
  );
  const jitterMs = clamp((10 / Math.max(factor, 0.05)) * blockJitMul, 2, 1200);

  const raw = {
    linkId,
    type,
    from,
    to,
    snrDb,
    ber,
    loss,
    throughputMbps,
    latencyMs,
    jitterMs
  };
  return { ...raw, status: judgeLink(raw) };
}

export function stepSim(
  state: SimState,
  red: RedConfig,
  blue: BlueConfig
): SimState {
  const tNext = state.tMs + red.dtMs;
  // 注入到期自动撤收
  let injection: InjectionState = state.injection;
  if (injection.active && tNext >= injection.untilMs) {
    injection = { kind: "none", untilMs: 0, active: false };
  }

  const injBarrage = injection.active && injection.kind === "barrage";
  const injBlock = injection.active && injection.kind === "block";
  const gains = computeStrategyGains(red.strategy, blue, injection);
  // 1) 运动
  const stepT = 0.012;
  const teams = state.teams.map((tm, idx) => {
    const jitter = (randn(tNext + idx * 17) - 0.5) * 0.00015;
    const next = moveTowards(tm.pos, red.teamsGoal, stepT);
    return {
      ...tm,
      pos: { ...next, lon: next.lon + jitter, lat: next.lat + jitter }
    };
  });

  const center = teams.reduce(
    (acc, tm) => ({
      lon: acc.lon + tm.pos.lon,
      lat: acc.lat + tm.pos.lat,
      alt: 0
    }),
    { lon: 0, lat: 0, alt: 0 }
  );
  center.lon /= teams.length;
  center.lat /= teams.length;

  const rwUav = moveTowards(state.rwUav, { ...center, alt: 300 }, 0.08);
  const fwUav = moveTowards(
    state.fwUav,
    { lon: center.lon - 0.01, lat: center.lat + 0.01, alt: 800 },
    0.04
  );

  // 2) 基础能力
  const baseSNR = 18;
  const baseLatency = 55;
  const baseShipUavThr = 80;
  const baseRwTeamThr = 25;
  const baseFwTeamThr = 45;

  // 3) 蓝方干扰（对象级）
  const shipFactor = applyJamming(1.0, blue.shipJamming, blue.intensity);
  const uavFactor = applyJamming(1.0, blue.uavSpectrumJamming, blue.intensity);
  const teamFactor = applyJamming(1.0, blue.teamCommJamming, blue.intensity);

  const injIntensityBoost = injBarrage ? 0.25 : 0.0; // 额外强度
  const boostedIntensity = clamp(blue.intensity + injIntensityBoost, 0, 1);

  const shipFactor2 = applyJamming(
    1.0,
    blue.shipJammer.mode,
    blue.shipJammer.intensity
  );
  const uavFactor2 = applyJamming(
    1.0,
    blue.uavJammer.mode,
    blue.uavJammer.intensity
  );
  const teamFactor2 = applyJamming(
    1.0,
    blue.teamJammer.mode,
    blue.teamJammer.intensity
  );
  // 4) 红方策略恢复
  const recover = applyRedStrategyRecovery(1.0, red.strategy);

  // 5) 船->两机
  const noise0 = (randn(tNext) - 0.5) * 1.8;
  const blockUp = injBlock
    ? Math.max(0, 0.4 * (1 - gains.blockMitigation))
    : 0.0;
  const blockDn = injBlock
    ? Math.max(0, 1.0 * (1 - gains.blockMitigation))
    : 0.0;
  const shipToFw = kpiFromFactor(
    "L01",
    "ship_to_fw_uav",
    "SHIP",
    "FW-UAV",
    baseShipUavThr,
    baseSNR,
    baseLatency,
    shipFactor2 * uavFactor2 * gains.ship * gains.uav,
    noise0,
    blockUp
  );
  const shipToRw = kpiFromFactor(
    "L02",
    "ship_to_rw_uav",
    "SHIP",
    "RW-UAV",
    55,
    baseSNR,
    70,
    shipFactor2 * uavFactor2 * gains.ship * gains.uav,
    noise0 * 0.8,
    blockUp
  );

  // 6) 两机->各小组
  const linksToTeams: LinkKPI[] = [];
  for (let i = 0; i < teams.length; i++) {
    const tm = teams[i];
    const n = (randn(tNext + i * 31) - 0.5) * 1.2;

    const dRw = haversineMeters(rwUav, tm.pos);
    const covRw = coverageFactorRw(dRw, red.rwUavRangeKm);
    const factorRw = covRw * uavFactor2 * teamFactor2 * gains.uav * gains.team;

    linksToTeams.push(
      kpiFromFactor(
        `L-RW-${tm.id}`,
        "rw_uav_to_team",
        "RW-UAV",
        tm.id,
        baseRwTeamThr,
        baseSNR,
        120,
        factorRw,
        n,
        blockDn
      )
    );

    const { cov: covFw } = coverageFactorFw(
      fwUav,
      tm.pos,
      red.fwUavRangeKm,
      red.fwUavPointingDeg,
      red.fwUavBeamDeg
    );
    const factorFw = covFw * uavFactor2 * teamFactor2 * gains.uav * gains.team;

    linksToTeams.push(
      kpiFromFactor(
        `L-FW-${tm.id}`,
        "fw_uav_to_team",
        "FW-UAV",
        tm.id,
        baseFwTeamThr,
        baseSNR,
        90,
        factorFw,
        n * 0.9,
        blockDn
      )
    );
  }

  const links: LinkKPI[] = [shipToFw, shipToRw, ...linksToTeams];

  // 7) 业务调度（严格退化：视频先退化）
  // 每小组选择更优下行（吞吐最大）作为该组可用链路
  const perTeamBest = teams.map(tm => {
    const rw = links.find(l => l.linkId === `L-RW-${tm.id}`)!;
    const fw = links.find(l => l.linkId === `L-FW-${tm.id}`)!;
    const best = rw.throughputMbps >= fw.throughputMbps ? rw : fw;
    return {
      id: tm.id,
      thr: best.throughputMbps,
      loss: best.loss,
      lat: best.latencyMs,
      status: best.status
    };
  });

  // 取 P10 反映“最差一批小组拖累”
  const sortedThr = perTeamBest.map(x => x.thr).sort((a, b) => a - b);
  const p10 = sortedThr[Math.floor(sortedThr.length * 0.1)] ?? 0;

  // 上游瓶颈（示意）
  const upstream = shipToFw.throughputMbps + shipToRw.throughputMbps;

  // capacity：以“下行可用 + 上游”共同约束（示意）
  const capacity = clamp(Math.min(p10 * teams.length * 0.1, upstream), 0, 80);

  // 业务需求（全局示意值，可后续放到 RedConfig 里）
  const demands: BizDemand[] = [
    { biz: "video", demandMbps: 35, minMbps: 6 },
    { biz: "voice", demandMbps: 14, minMbps: 5 },
    { biz: "text_image", demandMbps: 10, minMbps: 4 }
  ];

  const alloc = allocateByDegradeOrder(capacity, demands, [
    "video",
    "voice",
    "text_image"
  ]);
  const aVideo = alloc.find(x => x.biz === "video")!;
  const aVoice = alloc.find(x => x.biz === "voice")!;
  const aText = alloc.find(x => x.biz === "text_image")!;

  // 质量汇总：以最差 loss/lat 估计 OK 比例
  const worstLoss = Math.max(...perTeamBest.map(x => x.loss));
  const worstLat = Math.max(...perTeamBest.map(x => x.lat));

  // 带宽满足度：alloc/demand（视频在带宽不足时会先被打掉）
  const sat = (x: { allocMbps: number; demandMbps: number }) =>
    clamp(x.allocMbps / Math.max(x.demandMbps, 1e-6), 0, 1);

  const videoSat = sat(aVideo);
  const voiceSat = sat(aVoice);
  const textSat = sat(aText);

  const videoOk = clamp(
    0.15 + 0.7 * videoSat - worstLoss * 1.6 - (worstLat / 1600) * 0.3,
    0,
    1
  );
  const voiceOk = clamp(
    0.25 + 0.65 * voiceSat - worstLoss * 1.1 - (worstLat / 1600) * 0.22,
    0,
    1
  );
  const textOk = clamp(
    0.4 + 0.55 * textSat - worstLoss * 0.7 - (worstLat / 1600) * 0.12,
    0,
    1
  );
  const stallBoost = injBlock ? 2.2 : 1.0;
  const bizRaw: Omit<BizKPI, "status">[] = [
    {
      biz: "video",
      okRatio: videoOk,
      effectiveMbps: aVideo.allocMbps,
      allocMbps: aVideo.allocMbps,
      demandMbps: aVideo.demandMbps,
      p95LatencyMs: clamp(worstLat * 1.2, 30, 2500),
      stallPerMin: clamp((1 - videoOk) * 10 * stallBoost, 0, 30)
    },
    {
      biz: "voice",
      okRatio: voiceOk,
      effectiveMbps: aVoice.allocMbps,
      allocMbps: aVoice.allocMbps,
      demandMbps: aVoice.demandMbps,
      p95LatencyMs: clamp(worstLat * 1.05, 20, 1500),
      stallPerMin: 0
    },
    {
      biz: "text_image",
      okRatio: textOk,
      effectiveMbps: aText.allocMbps,
      allocMbps: aText.allocMbps,
      demandMbps: aText.demandMbps,
      p95LatencyMs: clamp(worstLat * 1.35, 40, 3500),
      stallPerMin: 0
    }
  ];
  const biz: BizKPI[] = bizRaw.map(b => ({ ...b, status: judgeBiz(b) }));

  // 8) 事件：关键链路状态变化（保留少量，防爆）
  const events = [...state.events];
  const trackIds = [
    "L01",
    "L02",
    `L-RW-${teams[0]?.id ?? "T01"}`,
    `L-FW-${teams[0]?.id ?? "T01"}`
  ];

  if (state.links.length) {
    for (const id of trackIds) {
      const prev = state.links.find(l => l.linkId === id);
      const now = links.find(l => l.linkId === id);
      if (prev && now && prev.status !== now.status) {
        events.push({
          tMs: tNext,
          type: "LINK",
          msg: `${id} ${prev.status} -> ${now.status}`
        });
      }
    }
  }

  // 可选：当 capacity 很低时提示“业务退化态”
  if (capacity < 8 && tNext % 5000 < red.dtMs) {
    events.push({
      tMs: tNext,
      type: "BIZ",
      msg: `Capacity=${capacity.toFixed(1)}Mbps，触发业务退化（视频优先退化）`
    });
  }

  return {
    ...state,
    tMs: tNext,
    ship: state.ship,
    rwUav,
    fwUav,
    teams,
    links,
    biz,
    events,
    injection
  };
}
