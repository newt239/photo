import { useEffect, useRef } from "react";

import { addOsmTileLayer } from "#/lib/leaflet.ts";

import classes from "./LocationMap.module.css";

import type * as Leaflet from "leaflet";

type LocationMapProps = {
  latitude: number;
  longitude: number;
};

export const LocationMap = ({ latitude, longitude }: LocationMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Leaflet は window に依存し SSR では読み込めないため、マウント後に動的 import して地図を生成する
  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    import("leaflet").then((leaflet) => {
      const container = containerRef.current;
      if (cancelled || !container) {
        return;
      }
      map = new leaflet.Map(container, { scrollWheelZoom: false }).setView(
        [latitude, longitude],
        14,
      );
      addOsmTileLayer(leaflet, map);
      leaflet
        .circleMarker([latitude, longitude], {
          color: "#228be6",
          fillColor: "#228be6",
          fillOpacity: 0.75,
          radius: 8,
          weight: 2,
        })
        .addTo(map);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [latitude, longitude]);

  return <div ref={containerRef} className={classes.map} />;
};
