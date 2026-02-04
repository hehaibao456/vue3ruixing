import type { GeoPoint } from "./types";

// 地球半径（m）
const R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/**
 * 从某点出发，按方位角(bearingDeg: 0北90东180南270西)走 distM 米，得到目标点
 * 这是标准大圆航线的目的点计算（适合 10km 这种尺度）
 */
export function destinationPoint(
  p: GeoPoint,
  bearingDeg: number,
  distM: number
): GeoPoint {
  const brng = toRad(bearingDeg);
  const φ1 = toRad(p.lat);
  const λ1 = toRad(p.lon);
  const δ = distM / R;

  const sinφ1 = Math.sin(φ1),
    cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ),
    cosδ = Math.cos(δ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(brng);
  const φ2 = Math.asin(sinφ2);

  const y = Math.sin(brng) * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  const lon = ((toDeg(λ2) + 540) % 360) - 180;
  const lat = toDeg(φ2);
  return { lon, lat, alt: p.alt ?? 0 };
}

/**
 * 以登陆点为基准，用“东/北”平面偏移（米）生成一个点（小范围近似很够用）
 * eastM: 向东为正；northM: 向北为正
 */
export function offsetEN(
  p: GeoPoint,
  eastM: number,
  northM: number,
  alt = 0
): GeoPoint {
  // 先北后东（两次 destination）
  const pN = destinationPoint(p, 0, northM);
  const pE = destinationPoint(pN, 90, eastM);
  return { ...pE, alt };
}
