import { Checkbox } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import { photoImageUrl } from "#/lib/image-url.ts";

import classes from "./PhotoCard.module.css";

export type PhotoCardData = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
  thumbnailKey: string | null;
  width: number;
  height: number;
  takenAt: string | null;
};

type PhotoCardProps = {
  photo: PhotoCardData;
  albumSlug?: string;
  selected?: boolean;
  onSelect?: (photoId: string) => void;
};

export const PhotoCard = ({ photo, albumSlug, selected = false, onSelect }: PhotoCardProps) => {
  const key = photo.thumbnailKey ?? photo.storageKey;
  const src = photoImageUrl(key);
  const thumb = (
    <div className={classes.thumb} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
      <img src={src} alt={photo.alt ?? photo.caption ?? ""} loading="lazy" />
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
        onChange={() => onSelect(photo.id)}
        aria-label={photo.caption ?? photo.alt ?? "この写真を選択する"}
      />
    </div>
  );
};
