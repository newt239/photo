import { useEffect, useRef, useState } from "react";

import { PhotoLightbox } from "#/components/organisms/PhotoLightbox";
import { photoImageUrl } from "#/lib/image-url.ts";
import { DEFAULT_CENTER, DEFAULT_ZOOM, addOsmTileLayer } from "#/lib/leaflet.ts";

import classes from "./PhotoMap.module.css";

import type * as Leaflet from "leaflet";

type PhotoMapItem = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
  latitude: number;
  longitude: number;
};

export const PhotoMap = ({ photos }: { photos: PhotoMapItem[] }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  // Leaflet は window に依存し SSR では読み込めないため、マウント後に動的 import して地図を生成する
  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    import("leaflet").then((leaflet) => {
      const container = containerRef.current;
      if (cancelled || !container) {
        return;
      }
      map = new leaflet.Map(container).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      addOsmTileLayer(leaflet, map);

      for (const [position, photo] of photos.entries()) {
        const pin = document.createElement("img");
        pin.src = photoImageUrl(photo.storageKey, 320);
        pin.alt = "";
        const marker = leaflet
          .marker([photo.latitude, photo.longitude], {
            alt: photo.alt ?? photo.caption ?? "",
            icon: leaflet.divIcon({
              className: classes.pin,
              html: pin,
              iconAnchor: [24, 24],
              iconSize: [48, 48],
            }),
          })
          .addTo(map);
        if (photo.caption) {
          const tooltip = document.createElement("span");
          tooltip.textContent = photo.caption;
          marker.bindTooltip(tooltip);
        }
        marker.on("click", () => setIndex(position));
      }

      map.fitBounds(
        leaflet.latLngBounds(photos.map((photo) => [photo.latitude, photo.longitude])),
        { maxZoom: 14, padding: [64, 64] },
      );
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [photos]);

  return (
    <>
      <div ref={containerRef} className={classes.map} />
      <PhotoLightbox
        photos={photos}
        index={index}
        onClose={() => setIndex(null)}
        onIndexChange={setIndex}
      />
    </>
  );
};
