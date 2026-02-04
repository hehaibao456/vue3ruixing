import type { BizKPI, LinkKPI } from "./types";

export const linkSla = {
  OK: { snrDb: 12, ber: 1e-5, loss: 0.02, latencyMs: 80 },
  DEG: { snrDb: 6, ber: 1e-3, loss: 0.1, latencyMs: 200 }
};

export function judgeLink(k: Omit<LinkKPI, "status">): LinkKPI["status"] {
  // DOWN：SNR很低或误码/丢包极高或吞吐接近0
  if (k.snrDb < 2 || k.ber > 5e-2 || k.loss > 0.35 || k.throughputMbps < 0.2)
    return "DOWN";
  // OK：满足严格阈值
  if (
    k.snrDb >= linkSla.OK.snrDb &&
    k.ber <= linkSla.OK.ber &&
    k.loss <= linkSla.OK.loss &&
    k.latencyMs <= linkSla.OK.latencyMs
  )
    return "OK";
  return "DEGRADED";
}

export const bizSla = {
  video: { okRatioOK: 0.95, p95LatencyOK: 150, stallPerMinOK: 1 },
  voice: { okRatioOK: 0.98, p95LatencyOK: 120, stallPerMinOK: 0 },
  text_image: { okRatioOK: 0.99, p95LatencyOK: 300, stallPerMinOK: 0 }
};

export function judgeBiz(k: Omit<BizKPI, "status">): BizKPI["status"] {
  if (k.okRatio < 0.7) return "DOWN";
  const sla = bizSla[k.biz];
  if (
    k.okRatio >= sla.okRatioOK &&
    k.p95LatencyMs <= sla.p95LatencyOK &&
    k.stallPerMin <= sla.stallPerMinOK
  )
    return "OK";
  return "DEGRADED";
}
