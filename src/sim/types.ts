import type { InjectionState } from "./injection";

export type TeamId = string;

export type BusinessType = "video" | "voice" | "text_image";

export type LinkType =
  | "ship_to_fw_uav"
  | "ship_to_rw_uav"
  | "fw_uav_to_team"
  | "rw_uav_to_team"
  | "ship_to_team";
// | "L-FW-T03";|"L-RW-T07";

export type InterferenceMode = "none" | "barrage" | "spot" | "sweep";
export type RedStrategy =
  | "baseline"
  | "fhss"
  | "power_control"
  | "reconfig_route";

export interface GeoPoint {
  lon: number;
  lat: number;
  alt: number;
}

export interface RedConfig {
  durationMin: number;
  dtMs: number;

  shipPos: GeoPoint;

  rwUavStart: GeoPoint;
  fwUavStart: GeoPoint;

  teamsStart: GeoPoint;
  teamsGoal: GeoPoint;
  teamCount: number;

  rwUavRangeKm: number; // 1km
  fwUavRangeKm: number; // 3km
  fwUavBeamDeg: number; // 固定翼指向波束宽度（半功率角示意）
  fwUavPointingDeg: number; // 固定翼主瓣指向角（相对北顺时针）

  strategy: RedStrategy;
}

export type JamMode = "none" | "spot" | "sweep" | "barrage";

export interface JammerSphere {
  mode: JamMode;
  intensity: number; // 0..1
  pos: GeoPoint;
  radiusKm: number;
}

export interface JammerRect {
  mode: JamMode;
  intensity: number; // 0..1
  center: GeoPoint;
  radiusKm: number; // 解释为“半边长”（square half-size），满足你“可设置干扰半径”
}

export interface BlueConfig {
  // 三个干扰源（位置可设、半径可设、方式可设、强度可设）
  shipJammer: JammerSphere; // 干扰源1：对船
  uavJammer: JammerSphere; // 干扰源2：对无人机
  teamJammer: JammerRect; // 干扰源3：对登岛人员（矩形）
}

export interface LinkKPI {
  linkId: string;
  type: LinkType;
  from: string;
  to: string;

  snrDb: number;
  ber: number;
  loss: number; // 0~1
  throughputMbps: number;
  latencyMs: number;
  jitterMs: number;

  status: "OK" | "DEGRADED" | "DOWN";
}

export interface BizKPI {
  biz: BusinessType;
  okRatio: number;
  effectiveMbps: number;

  allocMbps: number;
  demandMbps: number;

  p95LatencyMs: number;
  stallPerMin: number;
  status: "OK" | "DEGRADED" | "DOWN";
}

export interface SimState {
  tMs: number;
  running: boolean;

  // 实体位置
  ship: GeoPoint;
  rwUav: GeoPoint;
  fwUav: GeoPoint;
  teams: { id: TeamId; pos: GeoPoint }[];

  // KPI
  links: LinkKPI[];
  biz: BizKPI[];
  injection: InjectionState;
  // 事件（左侧可以后续加时间线）
  events: { tMs: number; type: string; msg: string }[];
}
