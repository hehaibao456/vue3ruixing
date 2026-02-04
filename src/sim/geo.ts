import type { GeoPoint } from "./types";

const R = 6371000; // 地球半径（m）

function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const lat1 = toRad(a.lat),
    lat2 = toRad(b.lat);
  const dlat = toRad(b.lat - a.lat);
  const dlon = toRad(b.lon - a.lon);

  const s =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

export function bearingDeg(from: GeoPoint, to: GeoPoint): number {
  // 0=北，90=东
  const lat1 = toRad(from.lat),
    lat2 = toRad(to.lat);
  const dlon = toRad(to.lon - from.lon);

  const y = Math.sin(dlon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlon);

  const brng = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return brng;
}

export function angleDiffDeg(a: number, b: number): number {
  // 最小角差 0..180
  const d = Math.abs(((a - b + 180) % 360) - 180);
  return d;
}
