export type InjectionKind = "none" | "barrage" | "block";

export interface InjectionState {
  kind: InjectionKind;
  untilMs: number; // 到期时间（仿真时间）
  active: boolean;
}

export function idleInjection(): InjectionState {
  return { kind: "none", untilMs: 0, active: false };
}
