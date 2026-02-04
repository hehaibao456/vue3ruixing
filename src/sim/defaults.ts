import type { BlueConfig, GeoPoint, RedConfig } from "./types";

import { destinationPoint, offsetEN } from "./layoutPreset";
const taipeiShallow: GeoPoint = { lon: 121.33, lat: 25.02, alt: 0 }; // 近海/浅水区附近
const landingPoint: GeoPoint = { lon: 121.39985848132484, lat: 25.170706115439433, alt: 0 };  //25.170706115439433, 121.39985848132484
const offshoreBearingDeg = 0;
const shipPos = destinationPoint(landingPoint, offshoreBearingDeg, 10_000);
const teamsStart = offsetEN(landingPoint, -2000, -800, 0); // 向西2.5km、向南0.8km
const teamsGoal = landingPoint; // 目标就是登陆点

const rwUavStart = offsetEN(landingPoint, -1800, -500, 300); // 离队伍近一些
const fwUavStart = offsetEN(landingPoint, -4500, 1200, 800); // 离登陆点更远、更高
export const defaultRed: RedConfig = {
  durationMin: 20,
  dtMs: 500,
  shipPos,
  rwUavStart,
  fwUavStart,

  teamsStart,
  teamsGoal,
  teamCount: 12,

  rwUavRangeKm: 1,
  fwUavRangeKm: 3,
  fwUavBeamDeg: 60,
  fwUavPointingDeg: 90,

  strategy: "baseline"
};

export const defaultBlue = {
  shipJammer: {
    mode: "spot",
    intensity: 0.45,
    pos: { lat: 25.15808156397532, lon: 121.37174546535702, alt: 0 },
    radiusKm: 10
  },
  uavJammer: {
    mode: "sweep",
    intensity: 0.5,
    pos: { lon: 121.43130753543643, lat: 25.18182902592531, alt: 0 },
    radiusKm: 3
  },
  teamJammer: {
    mode: "barrage",
    intensity: 0.55,
    center: { lon: 121.4437424253981, lat: 25.181736332338794, alt: 0 },
    radiusKm: 1
  }
} as const;
