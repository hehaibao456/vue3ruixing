<template>
  <div ref="el" style="width: 100%; height: 100%"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from "vue";
import * as Cesium from "cesium";
import { createViewer } from "../cesium/useCesiumViewer";
import type { GeoPoint, LinkKPI, BlueConfig } from "../sim/types";
const props = defineProps<{
  ship: GeoPoint;
  rwUav: GeoPoint;
  fwUav: GeoPoint;
  teams: { id: string; pos: GeoPoint }[];
  links: LinkKPI[];

  fwRangeKm: number;
  fwPointingDeg: number;
  fwBeamDeg: number;
  rwRangeKm: number;
  blue: BlueConfig;
}>();
let jammerShipEnt: Cesium.Entity | null = null;
let jammerUavEnt: Cesium.Entity | null = null;
let jammerTeamEnt: Cesium.Entity | null = null;

const el = ref<HTMLDivElement | null>(null);
let viewer: Cesium.Viewer | null = null;

let shipEnt: Cesium.Entity | null = null;
let rwEnt: Cesium.Entity | null = null;
let fwEnt: Cesium.Entity | null = null;
let fwSectorEnt: Cesium.Entity | null = null; // ✅ 固定翼3D扇形覆盖体
// let shipSphereEnt: Cesium.Entity | null = null;
// let rwSphereEnt: Cesium.Entity | null = null;

const teamEnts = new Map<string, Cesium.Entity>();

// 线实体
const linkEnts = new Map<string, Cesium.Entity>();
function upsertJammerSpheresAndRect() {
  if (!viewer) return;

  // 1) 干扰源1：对船（球体，紫红）
  const s1 = props.blue.shipJammer;
  if (s1.mode === "none" || s1.radiusKm <= 0) {
    if (jammerShipEnt) {
      viewer.entities.remove(jammerShipEnt);
      jammerShipEnt = null;
    }
  } else {
    const r = s1.radiusKm * 1000;
    const mat = makePulsingColorMaterial(
      Cesium.Color.MAGENTA,
      s1.mode,
      s1.intensity
    );

    if (!jammerShipEnt) {
      jammerShipEnt = viewer.entities.add({
        id: "JAM_SHIP",
        position: Cesium.Cartesian3.fromDegrees(
          s1.pos.lon,
          s1.pos.lat,
          s1.pos.alt ?? 0
        ),
        ellipsoid: {
          radii: new Cesium.Cartesian3(r, r, r),
          material: mat,
          outline: true,
          outlineColor: Cesium.Color.MAGENTA.withAlpha(0.55),
          outlineWidth: 1
        },
        label: {
          text: "JAM-Ship",
          font: "12px sans-serif",
          fillColor: Cesium.Color.MAGENTA,
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.35),
          pixelOffset: new Cesium.Cartesian2(10, -10)
        }
      });
    } else {
      jammerShipEnt.position = Cesium.Cartesian3.fromDegrees(
        s1.pos.lon,
        s1.pos.lat,
        s1.pos.alt ?? 0
      );
      if (jammerShipEnt.ellipsoid) {
        jammerShipEnt.ellipsoid.radii = new Cesium.Cartesian3(r, r, r);
        jammerShipEnt.ellipsoid.material = mat;
      }
    }
  }

  // 2) 干扰源2：对无人机（球体，青蓝，与源1显著不同颜色/节奏）
  const s2 = props.blue.uavJammer;
  if (s2.mode === "none" || s2.radiusKm <= 0) {
    if (jammerUavEnt) {
      viewer.entities.remove(jammerUavEnt);
      jammerUavEnt = null;
    }
  } else {
    const r = s2.radiusKm * 1000;
    const mat = makePulsingColorMaterial(
      Cesium.Color.CYAN,
      s2.mode,
      s2.intensity
    );

    if (!jammerUavEnt) {
      jammerUavEnt = viewer.entities.add({
        id: "JAM_UAV",
        position: Cesium.Cartesian3.fromDegrees(s2.pos.lon, s2.pos.lat, 0),
        ellipsoid: {
          radii: new Cesium.Cartesian3(r, r, r),
          material: mat,
          outline: true,
          outlineColor: Cesium.Color.CYAN.withAlpha(0.55),
          outlineWidth: 1
        },
        label: {
          text: "JAM-UAV",
          font: "12px sans-serif",
          fillColor: Cesium.Color.CYAN,
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.35),
          pixelOffset: new Cesium.Cartesian2(10, -10)
        }
      });
    } else {
      jammerUavEnt.position = Cesium.Cartesian3.fromDegrees(
        s2.pos.lon,
        s2.pos.lat,
        s2.pos.alt ?? 0
      );
      if (jammerUavEnt.ellipsoid) {
        jammerUavEnt.ellipsoid.radii = new Cesium.Cartesian3(r, r, r);
        jammerUavEnt.ellipsoid.material = mat;
      }
    }
  }

  // 3) 干扰源3：对登岛人员（矩形，多边形+条纹动画，红色，和球体显著差异）
  const s3 = props.blue.teamJammer;
  if (s3.mode === "none" || s3.radiusKm <= 0) {
    if (jammerTeamEnt) {
      viewer.entities.remove(jammerTeamEnt);
      jammerTeamEnt = null;
    }
  } else {
    // 用 radiusKm 作为“半边长”，构造正方形（可再扩展为长宽不同）
    const dLon =
      s3.radiusKm / 111.32 / Math.cos(Cesium.Math.toRadians(s3.center.lat)); // 近似换算
    const dLat = s3.radiusKm / 110.57;

    const lon1 = s3.center.lon - dLon;
    const lon2 = s3.center.lon + dLon;
    const lat1 = s3.center.lat - dLat;
    const lat2 = s3.center.lat + dLat;

    const hierarchy = new Cesium.PolygonHierarchy([
      Cesium.Cartesian3.fromDegrees(lon1, lat1, 0),
      Cesium.Cartesian3.fromDegrees(lon2, lat1, 0),
      Cesium.Cartesian3.fromDegrees(lon2, lat2, 0),
      Cesium.Cartesian3.fromDegrees(lon1, lat2, 0)
    ]);

    const mat = makePulsingStripeMaterial(
      Cesium.Color.RED,
      s3.mode,
      s3.intensity
    );

    if (!jammerTeamEnt) {
      jammerTeamEnt = viewer.entities.add({
        id: "JAM_TEAM_RECT",
        polygon: {
          hierarchy,
          material: mat,
          outline: true,
          outlineColor: Cesium.Color.RED.withAlpha(0.85)
        },
        label: {
          text: "JAM-Team Area",
          font: "12px sans-serif",
          fillColor: Cesium.Color.RED,
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.35),
          pixelOffset: new Cesium.Cartesian2(10, -10),
          position: Cesium.Cartesian3.fromDegrees(
            s3.center.lon,
            s3.center.lat,
            0
          ) as any
        } as any
      });
      // Cesium label 不能直接挂在 polygon 上的中心，这里用 entity.position:
      jammerTeamEnt.position = Cesium.Cartesian3.fromDegrees(
        s3.center.lon,
        s3.center.lat,
        0
      );
    } else {
      if (jammerTeamEnt.polygon) {
        jammerTeamEnt.polygon.hierarchy = hierarchy;
        jammerTeamEnt.polygon.material = mat;
      }
      jammerTeamEnt.position = Cesium.Cartesian3.fromDegrees(
        s3.center.lon,
        s3.center.lat,
        0
      );
      if (jammerTeamEnt.label) jammerTeamEnt.label.text = "JAM-Team Area";
    }
  }
}

function toCartesian(p: GeoPoint) {
  return Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt);
}
function modePulse(mode: string) {
  // 频率/形态：none 最弱，spot 快闪，sweep 中速，barrage 强脉冲
  if (mode === "spot") return { speed: 2.2, baseA: 0.12, ampA: 0.22 };
  if (mode === "sweep") return { speed: 1.3, baseA: 0.1, ampA: 0.18 };
  if (mode === "barrage") return { speed: 0.9, baseA: 0.18, ampA: 0.28 };
  return { speed: 0.6, baseA: 0.05, ampA: 0.05 };
}

function makePulsingColorMaterial(
  color: Cesium.Color,
  mode: string,
  intensity: number
) {
  const p = modePulse(mode);
  const mat = new Cesium.ColorMaterialProperty(
    new Cesium.CallbackProperty(() => {
      const t = Date.now() / 1000;
      const w = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * p.speed);
      const a = Cesium.Math.clamp(p.baseA + p.ampA * w * intensity, 0.03, 0.55);
      return color.withAlpha(a);
    }, false)
  );
  return mat;
}

function makePulsingStripeMaterial(
  base: Cesium.Color,
  mode: string,
  intensity: number
) {
  const p = modePulse(mode);
  return new Cesium.StripeMaterialProperty({
    evenColor: new Cesium.CallbackProperty(() => {
      const t = Date.now() / 1000;
      const w = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * p.speed);
      const a = Cesium.Math.clamp(0.1 + 0.25 * w * intensity, 0.05, 0.55);
      return base.withAlpha(a);
    }, false),
    oddColor: Cesium.Color.BLACK.withAlpha(0.02),
    repeat: new Cesium.CallbackProperty(() => {
      // 强度越大条纹越密（显著差异）
      return 6 + Math.floor(intensity * 10);
    }, false),
    offset: new Cesium.CallbackProperty(() => {
      // 模拟“扫频滚动”
      const t = Date.now() / 1000;
      return (t * (mode === "sweep" ? 0.25 : 0.1)) % 1;
    }, false)
  });
}

function statusColor(s: LinkKPI["status"]) {
  // OK=绿，DEGRADED=黄，DOWN=红
  if (s === "OK") return Cesium.Color.LIME;
  if (s === "DEGRADED") return Cesium.Color.YELLOW;
  return Cesium.Color.RED;
}

function upsertPoint(
  id: string,
  name: string,
  p: GeoPoint,
  kind: "ship" | "rw" | "fw" | "team"
) {
  if (!viewer) return null;
  const pos = toCartesian(p);

  const color =
    kind === "ship"
      ? Cesium.Color.CYAN
      : kind === "fw"
      ? Cesium.Color.ORANGE
      : kind === "rw"
      ? Cesium.Color.YELLOW
      : Cesium.Color.LIME;

  const pixelSize = kind === "team" ? 8 : 12;

  const ent =
    viewer.entities.getById(id) ??
    viewer.entities.add({
      id,
      name,
      position: pos,
      point: {
        pixelSize,
        color,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1
      },
      label: {
        text: name,
        font: "12px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(10, -10),
        showBackground: true,
        backgroundColor: Cesium.Color.fromAlpha(Cesium.Color.BLACK, 0.45)
      }
    });

  ent.position = pos;
  return ent;
}
// function upsertSphereCover(
//   id: string,
//   center: GeoPoint,
//   radiusM: number,
//   color: Cesium.Color,
//   centerAltM: number // 球心高度（很关键）
// ) {
//   if (!viewer) return;

//   const pos = Cesium.Cartesian3.fromDegrees(center.lon, center.lat, centerAltM);

//   // 呼吸特效：alpha 0.08~0.22
//   const alphaCb = new Cesium.CallbackProperty(() => {
//     const t = viewer!.clock.currentTime.secondsOfDay;
//     const a = 0.04 + 0.08 * (0.5 + 0.5 * Math.sin(t * 1.5));
//     return color.withAlpha(a);
//   }, false);

//   const outlineAlphaCb = new Cesium.CallbackProperty(() => {
//     const t = viewer!.clock.currentTime.secondsOfDay;
//     const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.6));
//     return color.withAlpha(a);
//   }, false);

//   const ent =
//     viewer.entities.getById(id) ??
//     viewer.entities.add({
//       id,
//       position: pos,
//       ellipsoid: {
//         radii: new Cesium.Cartesian3(radiusM, radiusM, radiusM),
//         material: new Cesium.ColorMaterialProperty(alphaCb),
//         outline: false // ✅ 去掉线条
//       }
//     });

//   ent.position = pos;

//   if (ent.ellipsoid) {
//     ent.ellipsoid.radii = new Cesium.Cartesian3(radiusM, radiusM, radiusM);
//     ent.ellipsoid.material = new Cesium.ColorMaterialProperty(alphaCb);
//     ent.ellipsoid.outline = true;
//     ent.ellipsoid.outlineColor = new Cesium.ColorMaterialProperty(
//       outlineAlphaCb
//     );
//     ent.ellipsoid.outlineWidth = 2;
//   }
// }
function upsertSphereCover(
  id: string,
  center: GeoPoint,
  radiusM: number,
  color: Cesium.Color,
  centerAltM: number, // 球心高度：通信船就用 ship.alt(一般是0)
  half: boolean = false // ✅ true=半球（上半球），false=整球
) {
  if (!viewer) return;

  const pos = Cesium.Cartesian3.fromDegrees(center.lon, center.lat, centerAltM);

  // ✅ 让 ellipsoid 的“+Z”对齐到本地 Up（ENU），这样 cone 裁切就是上下半球
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    pos,
    new Cesium.HeadingPitchRoll(0, 0, 0)
  );

  // 呼吸特效：alpha 0.06~0.22
  const matCb = new Cesium.CallbackProperty(() => {
    const t = viewer!.clock.currentTime.secondsOfDay;
    const a = 0.06 + 0.16 * (0.5 + 0.5 * Math.sin(t * 1.5));
    return color.withAlpha(a);
  }, false);

  const ent =
    viewer.entities.getById(id) ??
    viewer.entities.add({
      id,
      position: pos,
      orientation,
      ellipsoid: {
        radii: new Cesium.Cartesian3(radiusM, radiusM, radiusM),
        material: new Cesium.ColorMaterialProperty(matCb),

        // ✅ 半球关键：用 cone 裁切（角度从 +Z 轴量起）
        // 0..PI/2 = 上半球；0..PI = 整球
        minimumCone: half ? 0 : 0,
        maximumCone: half ? Cesium.Math.PI_OVER_TWO : Cesium.Math.PI,

        // ✅ 去掉线框（你之前一直嫌线条太多）
        outline: false
      }
    });

  ent.position = pos;
  ent.orientation = orientation;

  if (ent.ellipsoid) {
    ent.ellipsoid.radii = new Cesium.Cartesian3(radiusM, radiusM, radiusM);
    ent.ellipsoid.material = new Cesium.ColorMaterialProperty(matCb);
    ent.ellipsoid.outline = false;

    ent.ellipsoid.minimumCone = half ? 0 : 0;
    ent.ellipsoid.maximumCone = half ? Cesium.Math.PI_OVER_TWO : Cesium.Math.PI;
  }
}

function upsertPolyline(
  id: string,
  a: GeoPoint,
  b: GeoPoint,
  status: LinkKPI["status"],
  width = 3
) {
  if (!viewer) return;
  const positions = [toCartesian(a), toCartesian(b)];
  const color = statusColor(status).withAlpha(0.85);

  const ent =
    linkEnts.get(id) ??
    viewer.entities.add({
      id,
      polyline: {
        positions,
        width,
        material: color,
        clampToGround: false
      }
    });

  if (!ent.polyline) return;
  ent.polyline.positions = positions;
  ent.polyline.material = color;
  ent.polyline.width = width;

  linkEnts.set(id, ent);
}

// --- 固定翼波束扇形 ---
// 基于球面近似：从中心点出发，按 bearing 走 distance 得到点
function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

function destinationPoint(
  lon: number,
  lat: number,
  bearingDeg: number,
  distM: number
) {
  const R = 6371000;
  const brng = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lon);
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

  return { lon: ((toDeg(λ2) + 540) % 360) - 180, lat: toDeg(φ2) };
}

function sectorPolygonDegrees(
  center: GeoPoint,
  radiusM: number,
  pointingDeg: number,
  beamDeg: number,
  seg = 28
) {
  const half = beamDeg / 2;
  const start = pointingDeg - half;
  const end = pointingDeg + half;

  const pts: { lon: number; lat: number }[] = [];
  pts.push({ lon: center.lon, lat: center.lat }); // 扇形顶点
  for (let i = 0; i <= seg; i++) {
    const brg = start + (i / seg) * (end - start);
    pts.push(destinationPoint(center.lon, center.lat, brg, radiusM));
  }
  return pts;
}

function upsertFwSector3D() {
  if (!viewer) return;

  const radiusM = Math.max(200, props.fwRangeKm * 1000);

  // 扇形底面点（经纬度）
  const pts = sectorPolygonDegrees(
    { lon: props.fwUav.lon, lat: props.fwUav.lat, alt: 0 },
    radiusM,
    props.fwPointingDeg,
    props.fwBeamDeg,
    40
  );

  const hierarchy = new Cesium.PolygonHierarchy(
    pts.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 0))
  );

  // 让扇形成为“空中体积”（关键：height / extrudedHeight）
  const uavAlt = props.fwUav.alt ?? 800;
  const halfThickness = 2000; // 扇形厚度的一半（越大越立体）
  const height = Math.max(0, uavAlt - halfThickness);
  const extruded = uavAlt + halfThickness;

  // 动态扫描：alpha 0.06~0.20
  const matCb = new Cesium.CallbackProperty(() => {
    const t = viewer!.clock.currentTime.secondsOfDay;
    const a = 0.06 + 0.14 * (0.5 + 0.5 * Math.sin(t * 1.6));
    return Cesium.Color.ORANGE.withAlpha(a);
  }, false);

  // 侧壁边缘更亮一点
  const outlineCb = new Cesium.CallbackProperty(() => {
    const t = viewer!.clock.currentTime.secondsOfDay;
    const a = 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.2));
    return Cesium.Color.ORANGE.withAlpha(a);
  }, false);

  if (!fwSectorEnt) {
    fwSectorEnt = viewer.entities.add({
      id: "FW_SECTOR_3D",
      polygon: {
        hierarchy,
        height,
        extrudedHeight: extruded,
        perPositionHeight: false,
        material: new Cesium.ColorMaterialProperty(matCb),
        outline: true,
        outlineColor: new Cesium.ColorMaterialProperty(outlineCb)
      }
    });
  } else if (fwSectorEnt.polygon) {
    fwSectorEnt.polygon.hierarchy = hierarchy;
    fwSectorEnt.polygon.height = height;
    fwSectorEnt.polygon.extrudedHeight = extruded;
    fwSectorEnt.polygon.material = new Cesium.ColorMaterialProperty(matCb);
    fwSectorEnt.polygon.outline = true;
    fwSectorEnt.polygon.outlineColor = new Cesium.ColorMaterialProperty(
      outlineCb
    );
  }
}

function upsertEllipseCover(
  id: string,
  center: GeoPoint,
  radiusM: number,
  heightM: number,
  color: Cesium.Color
) {
  if (!viewer) return;

  const pos = Cesium.Cartesian3.fromDegrees(center.lon, center.lat, 0);

  const ent =
    viewer.entities.getById(id) ??
    viewer.entities.add({
      id,
      position: pos,
      ellipse: {
        semiMajorAxis: radiusM,
        semiMinorAxis: radiusM,
        height: 0,
        extrudedHeight: heightM, // ✅ 3D 拉伸
        material: color.withAlpha(0.18), // ✅ 阴影感
        outline: true,
        outlineColor: color.withAlpha(0.65),
        outlineWidth: 2
      }
    });

  // 更新
  ent.position = pos;
  if (ent.ellipse) {
    ent.ellipse.semiMajorAxis = radiusM;
    ent.ellipse.semiMinorAxis = radiusM;
    ent.ellipse.height = 0;
    ent.ellipse.extrudedHeight = heightM;
    ent.ellipse.material = color.withAlpha(0.18);
    ent.ellipse.outlineColor = color.withAlpha(0.65);
  }
}

function getLink(id: string) {
  return props.links?.find(l => l.linkId === id) ?? null;
}

function bestDownlinkForTeam(teamId: string) {
  const rw = getLink(`L-RW-${teamId}`);
  const fw = getLink(`L-FW-${teamId}`);
  if (!rw && !fw) return null;
  if (!fw) return rw!;
  if (!rw) return fw!;
  return rw.throughputMbps >= fw.throughputMbps ? rw : fw;
}

function cleanupOldLinks(validIds: Set<string>) {
  if (!viewer) return;
  for (const [id, ent] of linkEnts.entries()) {
    if (!validIds.has(id)) {
      viewer.entities.remove(ent);
      linkEnts.delete(id);
    }
  }
}

onMounted(() => {
  if (!el.value) return;
  viewer = createViewer(el.value);

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  console.log(props);
  handler.setInputAction((movement: any) => {
    const cartesian = viewer!.camera.pickEllipsoid(
      movement.position,
      viewer!.scene.globe.ellipsoid
    );
    if (!cartesian) return;

    const carto = Cesium.Cartographic.fromCartesian(cartesian);
    const lon = Cesium.Math.toDegrees(carto.longitude);
    const lat = Cesium.Math.toDegrees(carto.latitude);

    console.log("[PICK]", { lon: +lon.toFixed(6), lat: +lat.toFixed(6) });
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  //   props.fwUav.value = { lon: 121.38034642651986, lat: 25.199559362317704, alt: 0 };
  //   props.rwUav.value = { lon: 121.39709869394764, lat: 25.189010368701283, alt: 0 };
  shipEnt = upsertPoint("SHIP", "通信船", props.ship, "ship");
  fwEnt = upsertPoint("FW", "固定翼无人机", props.fwUav, "fw");
  rwEnt = upsertPoint("RW", "旋翼无人机", props.rwUav, "rw");

  for (const tm of props.teams) {
    const e = upsertPoint(tm.id, tm.id, tm.pos, "team");
    if (e) teamEnts.set(tm.id, e);
  }

  upsertFwSector3D();
  upsertJammerSpheresAndRect();
  // ✅ 同时初始化船/旋翼覆盖体
  //   upsertSphereCover(
  //     "SHIP_SPHERE",
  //     props.ship,
  //     10_000,
  //     Cesium.Color.CYAN,
  //     10_000
  //   );
  upsertSphereCover(
    "SHIP_SPHERE",
    props.ship,
    11_000,
    Cesium.Color.CYAN,
    props.ship.alt ?? 0,
    true // ✅ 半球
  );

  //   upsertSphereCover(
  //     "SHIP_SPHERE",
  //     props.ship,
  //     10_000,
  //     Cesium.Color.CYAN,
  //     10_000
  //   );
  // ✅ 旋翼：1km 球体（球心放在无人机高度）
  upsertSphereCover(
    "RW_SPHERE",
    props.rwUav,
    Math.max(50, props.rwRangeKm * 1000),
    Cesium.Color.YELLOW,
    props.rwUav.alt ?? 300
  );

  // ✅ 放到最后：创建完实体再飞到“船”
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      props.ship.lon,
      props.ship.lat,
      45000
    )
  });
});

watch(
  () => [props.ship, props.rwUav, props.fwUav, props.teams],
  () => {
    if (!viewer) return;

    if (shipEnt) shipEnt.position = toCartesian(props.ship);
    if (rwEnt) rwEnt.position = toCartesian(props.rwUav);
    if (fwEnt) fwEnt.position = toCartesian(props.fwUav);

    for (const tm of props.teams) {
      const existing = teamEnts.get(tm.id);
      if (existing) existing.position = toCartesian(tm.pos);
      else {
        const e = upsertPoint(tm.id, tm.id, tm.pos, "team");
        if (e) teamEnts.set(tm.id, e);
      }
    }
  },
  { deep: true }
);

// 链路与波束刷新（包含 links + 指向参数）
watch(
  () => [
    props.links,
    props.fwRangeKm,
    props.fwPointingDeg,
    props.fwBeamDeg,
    props.ship,
    props.rwUav,
    props.fwUav,
    props.teams
  ],
  () => {
    if (!viewer) return;

    upsertFwSector3D();
    upsertJammerSpheresAndRect();
    // 1) 固定翼波束
    // upsertEllipseCover(
    //   "SHIP_COVER_3D",
    //   props.ship,
    //   10_000,
    //   1500,
    //   Cesium.Color.CYAN
    // );
    // upsertEllipseCover(
    //   "RW_COVER_3D",
    //   props.rwUav,
    //   Math.max(50, props.rwRangeKm * 1000),
    //   1200,
    //   Cesium.Color.YELLOW
    // );
    upsertSphereCover(
      "SHIP_SPHERE",
      props.ship,
      11_000,
      Cesium.Color.CYAN,
      props.ship.alt ?? 0,
      true
    );

    upsertSphereCover(
      "RW_SPHERE",
      props.rwUav,
      Math.max(50, props.rwRangeKm * 1000),
      Cesium.Color.YELLOW,
      props.rwUav.alt ?? 300,
      false
    );
    // 2) 上游链路
    const valid = new Set<string>();

    const l01 = getLink("L01");
    const l02 = getLink("L02");

    if (l01) {
      upsertPolyline("VIS_L01", props.ship, props.fwUav, l01.status, 4);
      valid.add("VIS_L01");
    }
    if (l02) {
      upsertPolyline("VIS_L02", props.ship, props.rwUav, l02.status, 4);
      valid.add("VIS_L02");
    }

    // 3) 到每个小组的“择优下行链路”
    for (const tm of props.teams) {
      const best = bestDownlinkForTeam(tm.id);
      if (!best) continue;

      const fromPos = best.from === "RW-UAV" ? props.rwUav : props.fwUav;
      const id = `VIS_${tm.id}`;
      upsertPolyline(id, fromPos, tm.pos, best.status, 3);
      valid.add(id);
    }

    cleanupOldLinks(valid);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
});
</script>
