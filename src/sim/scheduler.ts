import type { BusinessType } from "./types";

export interface BizDemand {
  biz: BusinessType;
  // 理想需求（Mbps）
  demandMbps: number;
  // 最低保障（Mbps）
  minMbps: number;
}

/**
 * 分配规则（严格退化顺序）：
 * 1) 先保证所有业务的 min
 * 2) 若总 min > capacity，则按退化顺序削减（视频先削，随后语音，最后文本/图像）
 * 3) 若 capacity 充裕，则在 min 基础上按“剩余需求比例”补齐到 demand
 */
export function allocateByDegradeOrder(
  capacityMbps: number,
  demands: BizDemand[],
  degradeOrder: BusinessType[] = ["video", "voice", "text_image"]
) {
  const d = demands.map(x => ({ ...x, alloc: 0 }));

  // 先分配 min
  let used = 0;
  for (const x of d) {
    x.alloc = x.minMbps;
    used += x.alloc;
  }

  // min 超出容量：按退化顺序从 min 里削减（视频先削）
  if (used > capacityMbps) {
    let over = used - capacityMbps;
    for (const biz of degradeOrder) {
      const x = d.find(v => v.biz === biz);
      if (!x) continue;
      const reducible = x.alloc; // 允许降到 0
      const cut = Math.min(reducible, over);
      x.alloc -= cut;
      over -= cut;
      if (over <= 1e-9) break;
    }
    return d.map(x => ({
      biz: x.biz,
      allocMbps: Math.max(0, x.alloc),
      demandMbps: x.demandMbps,
      minMbps: x.minMbps
    }));
  }

  // 有余量：按剩余需求比例补齐到 demand
  let remaining = capacityMbps - used;
  const need = d.map(x => ({
    biz: x.biz,
    need: Math.max(0, x.demandMbps - x.alloc)
  }));
  const totalNeed = need.reduce((s, x) => s + x.need, 0);

  if (totalNeed > 1e-9) {
    for (const x of d) {
      const n = need.find(v => v.biz === x.biz)!.need;
      const add = remaining * (n / totalNeed);
      x.alloc += add;
    }
  }

  return d.map(x => ({
    biz: x.biz,
    allocMbps: Math.max(0, x.alloc),
    demandMbps: x.demandMbps,
    minMbps: x.minMbps
  }));
}
