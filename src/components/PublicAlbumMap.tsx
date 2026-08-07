import { useEffect, useRef } from "react";

import classes from "./PublicAlbumMap.module.css";

import type * as Leaflet from "leaflet";

type PublicAlbumMapPhoto = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
  thumbnailKey: string | null;
  latitude: number | null;
  longitude: number | null;
};

export const PublicAlbumMap = ({ photos }: { photos: PublicAlbumMapPhoto[] }) => {
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
      map = new leaflet.Map(container).setView([35.681_2, 139.767_1], 4);
      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        })
        .addTo(map);

      const coordinates: Leaflet.LatLngTuple[] = [];
      for (const photo of photos) {
        if (photo.latitude === null || photo.longitude === null) {
          continue;
        }
        const thumbnailSrc = `/api/i/${(photo.thumbnailKey ?? photo.storageKey).replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`;
        const pin = document.createElement("img");
        pin.src = thumbnailSrc;
        pin.alt = "";
        const marker = leaflet
          .marker([photo.latitude, photo.longitude], {
            alt: photo.alt ?? photo.caption ?? "",
            icon: leaflet.divIcon({
              className: classes.pin,
              html: pin,
              iconAnchor: [24, 24],
              iconSize: [48, 48],
              popupAnchor: [0, -24],
            }),
          })
          .addTo(map);

        const preview = document.createElement("img");
        preview.src = thumbnailSrc;
        preview.alt = photo.alt ?? photo.caption ?? "";
        const link = document.createElement("a");
        link.href = `/api/i/${photo.storageKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.replaceChildren(preview);
        const popup = document.createElement("div");
        popup.className = classes.popup ?? "";
        if (photo.caption) {
          const caption = document.createElement("span");
          caption.textContent = photo.caption;
          popup.replaceChildren(link, caption);
        } else {
          popup.replaceChildren(link);
        }
        marker.bindPopup(popup);
        coordinates.push([photo.latitude, photo.longitude]);
      }

      if (coordinates.length > 0) {
        map.fitBounds(leaflet.latLngBounds(coordinates), { maxZoom: 14, padding: [64, 64] });
      }
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [photos]);

  if (photos.every((photo) => photo.latitude === null || photo.longitude === null)) {
    return <div className={classes.empty}>位置情報のある写真がありません</div>;
  }
  return <div ref={containerRef} className={classes.map} />;
};
