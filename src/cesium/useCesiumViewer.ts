import * as Cesium from "cesium";
Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlOTNlNGE1Zi1mNWJmLTQxN2EtOWQ3Zi03MDAyNjIyYmU4MTgiLCJpZCI6MzgxMjE1LCJpYXQiOjE3Njg5MTMwMDl9.ZqqvaeKVdR17FBZbrSIBi_t-rJMLnkjkMl3UxTp0NLk";
export function createViewer(container: HTMLElement) {
  const viewer = new Cesium.Viewer(container, {
    animation: false,
    timeline: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    baseLayerPicker: true,
    infoBox: false,
    selectionIndicator: true,
    shouldAnimate: true
  });

  viewer.scene.globe.depthTestAgainstTerrain = false;

  return viewer;
}
