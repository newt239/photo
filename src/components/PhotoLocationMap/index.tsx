import { useEffect, useRef } from "react";

import classes from "./PhotoLocationMap.module.css";

import type * as Leaflet from "leaflet";

type PhotoLocationMapProps = {
  latitude: number;
  longitude: number;
};

export const PhotoLocationMap = ({ latitude, longitude }: PhotoLocationMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Leaflet は window に依存し SSR では読み込めないため、マウント後に動的 import して地図を生成する
  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    void import("leaflet").then((leaflet) => {
      const container = containerRef.current;
      if (cancelled || !container) {
        return;
      }
      map = new leaflet.Map(container, { scrollWheelZoom: false }).setView(
        [latitude, longitude],
        14,
      );
      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        })
        .addTo(map);
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
