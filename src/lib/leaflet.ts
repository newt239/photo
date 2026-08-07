import type * as Leaflet from "leaflet";

export const DEFAULT_CENTER: [number, number] = [35.681_2, 139.767_1];
export const DEFAULT_ZOOM = 4;

export const addOsmTileLayer = (leaflet: typeof Leaflet, map: Leaflet.Map): void => {
  leaflet
    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    })
    .addTo(map);
};
