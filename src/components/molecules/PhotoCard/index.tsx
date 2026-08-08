import { Checkbox } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { MapPinOffIcon } from "lucide-react";

import { photoImageUrl } from "#/lib/image-url.ts";

import classes from "./PhotoCard.module.css";

export type PhotoCardData = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
  width: number;
  height: number;
  takenAt: string | null;
  hasLocation: boolean;
};

type PhotoCardProps = {
  photo: PhotoCardData;
  albumSlug?: string;
  selected?: boolean;
  onSelect?: (photoId: string, extend: boolean) => void;
};

export const PhotoCard = ({ photo, albumSlug, selected = false, onSelect }: PhotoCardProps) => {
  const thumb = (
    <div className={classes.thumb} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
      <img
        src={photoImageUrl(photo.storageKey, 640)}
        srcSet={[320, 640, 1024]
          .filter((width) => width <= photo.width)
          .map((width) => `${photoImageUrl(photo.storageKey, width)} ${width}w`)
          .join(", ")}
        sizes="(max-width: 768px) 50vw, 240px"
        alt={photo.alt ?? photo.caption ?? ""}
        loading="lazy"
        decoding="async"
      />
      {!photo.hasLocation && (
        <span className={classes.badge}>
          <MapPinOffIcon size={14} role="img" aria-label="位置情報が未設定" />
        </span>
      )}
      {photo.caption && <span className={classes.caption}>{photo.caption}</span>}
    </div>
  );
  const link =
    albumSlug === undefined ? (
      <Link to="/admin/photos/$photoId" params={{ photoId: photo.id }} className={classes.link}>
        {thumb}
      </Link>
    ) : (
      <Link
        to="/admin/albums/$slug/photos/$photoId"
        params={{ photoId: photo.id, slug: albumSlug }}
        className={classes.link}
      >
        {thumb}
      </Link>
    );
  if (!onSelect) {
    return link;
  }
  return (
    <div className={classes.card} data-selected={selected || undefined}>
      {link}
      <Checkbox
        className={classes.check}
        checked={selected}
        readOnly
        onClick={(event) => onSelect(photo.id, event.shiftKey)}
        aria-label={photo.caption ?? photo.alt ?? "この写真を選択する"}
      />
    </div>
  );
};
