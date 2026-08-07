import { useState } from "react";

import { SegmentedControl, Slider } from "@mantine/core";
import { ZoomInIcon, ZoomOutIcon } from "lucide-react";

import classes from "./PublicAlbumGallery.module.css";
import { PublicAlbumMap } from "./PublicAlbumMap";

type PublicGalleryPhoto = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
  thumbnailKey: string | null;
  width: number;
  height: number;
  latitude: number | null;
  longitude: number | null;
};

type PublicAlbumGalleryProps = {
  title: string | null;
  description: string | null;
  photos: PublicGalleryPhoto[];
};

export const PublicAlbumGallery = ({ title, description, photos }: PublicAlbumGalleryProps) => {
  const [mode, setMode] = useState("photo");
  const [size, setSize] = useState(3);

  return (
    <>
      {mode === "map" ? (
        <PublicAlbumMap photos={photos} />
      ) : (
        <>
          <div className={classes.gallery} style={{ columnWidth: `${size * 160}px` }}>
            {photos.map((p) => (
              <a
                key={p.id}
                className={classes.item}
                href={`/api/i/${p.storageKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`/api/i/${(p.thumbnailKey ?? p.storageKey).replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`}
                  alt={p.alt ?? p.caption ?? ""}
                  loading="lazy"
                  style={{ aspectRatio: `${p.width} / ${p.height}` }}
                />
                {p.caption && <span className={classes.caption}>{p.caption}</span>}
              </a>
            ))}
          </div>
          <div className={classes.overlay}>
            <div className={classes.overlayTitle}>{title ?? "(無題)"}</div>
            {description && <div className={classes.overlayDescription}>{description}</div>}
          </div>
        </>
      )}

      <div className={classes.controls}>
        <SegmentedControl
          size="xs"
          value={mode}
          onChange={setMode}
          data={[
            { label: "写真", value: "photo" },
            { label: "地図", value: "map" },
          ]}
        />
        {mode === "photo" && (
          <>
            <ZoomOutIcon size={16} aria-hidden />
            <Slider
              className={classes.slider}
              min={1}
              max={5}
              step={1}
              value={size}
              onChange={setSize}
              label={null}
              thumbLabel="表示サイズ"
            />
            <ZoomInIcon size={16} aria-hidden />
          </>
        )}
      </div>
    </>
  );
};
