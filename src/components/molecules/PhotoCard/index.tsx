import { Checkbox } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { MapPinOffIcon } from "lucide-react";

import { photoImageUrl, photoSrcSet } from "#/lib/image-url.ts";
import { photoDetailLink } from "#/lib/photo-link.ts";

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
  selected: boolean;
  onSelect: (photoId: string, extend: boolean) => void;
};

export const PhotoCard = ({ photo, albumSlug, selected, onSelect }: PhotoCardProps) => {
  const thumb = (
    <div className={classes.thumb} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
      <img
        src={photoImageUrl(photo.storageKey, 640)}
        srcSet={photoSrcSet(photo.storageKey, [320, 640], photo.width)}
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
  return (
    <div className={classes.card} data-selected={selected || undefined}>
      <Link {...photoDetailLink(photo.id, albumSlug)} className={classes.link}>
        {thumb}
      </Link>
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
