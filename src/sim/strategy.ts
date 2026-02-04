import type { BlueConfig, RedConfig } from "./types";
import type { InjectionState } from "./injection";

export interface StrategyGains {
  // 分别作用于三个对象域：船、无人机、终端
  ship: number;
  uav: number;
  team: number;

  // 阻塞式（排队）抑制效果：0..1（越大越能抑制 block 的 latency/jitter 惩罚）
  blockMitigation: number;
}

/**
 * 设计原则（示意但可解释）：
 * - FHSS：对 spot/sweep 更有效，对 barrage 较弱；主要作用于频谱域（uav/team）
 * - 功控：提升边缘链路质量（ship/uav/team 都有），但对 block 作用有限
 * - 重构：对 block 最有效（可避开拥塞/改路/切换中继），对 barrage 中等
 */
export function computeStrategyGains(
  strategy: RedConfig["strategy"],
  blue: BlueConfig,
  inj: InjectionState
): StrategyGains {
  const isBlock = inj.active && inj.kind === "block";

  const isSpotOrSweep = (m: string) => m === "spot" || m === "sweep";
  const isBarrage = (m: string) => m === "barrage";

  // 基础
  let ship = 1.0,
    uav = 1.0,
    team = 1.0;
  let blockMitigation = 0.0;

  if (strategy === "baseline") {
    blockMitigation = 0.0;
  }

  if (strategy === "fhss") {
    // FHSS：对 spot/sweep（频率相关）显著提升；对 barrage 弱
    const uavBoost = isSpotOrSweep(blue.uavSpectrumJamming)
      ? 1.3
      : isBarrage(blue.uavSpectrumJamming)
      ? 1.08
      : 1.15;
    const teamBoost = isSpotOrSweep(blue.teamCommJamming)
      ? 1.28
      : isBarrage(blue.teamCommJamming)
      ? 1.06
      : 1.12;
    // 船端主要受电磁压制影响，FHSS 仅小幅
    const shipBoost = isSpotOrSweep(blue.shipJamming)
      ? 1.12
      : isBarrage(blue.shipJamming)
      ? 1.04
      : 1.08;

    ship *= shipBoost;
    uav *= uavBoost;
    team *= teamBoost;

    blockMitigation = isBlock ? 0.1 : 0.0;
  }

  if (strategy === "power_control") {
    // 功控：整体提升链路裕量（更像 SNR 提升），对 barrage/边缘覆盖有用
    ship *= isBarrage(blue.shipJamming) ? 1.18 : 1.12;
    uav *= isBarrage(blue.uavSpectrumJamming) ? 1.16 : 1.1;
    team *= isBarrage(blue.teamCommJamming) ? 1.14 : 1.1;

    blockMitigation = isBlock ? 0.12 : 0.0;
  }

  if (strategy === "reconfig_route") {
    // 重构：对 block 最强；对 barrage 中等；对 spot/sweep 也有一定收益（切换链路/多跳）
    ship *= isBarrage(blue.shipJamming) ? 1.15 : 1.1;
    uav *= isBarrage(blue.uavSpectrumJamming) ? 1.14 : 1.12;
    team *= isBarrage(blue.teamCommJamming) ? 1.14 : 1.12;

    blockMitigation = isBlock ? 0.55 : 0.1;
  }

  return { ship, uav, team, blockMitigation };
}
