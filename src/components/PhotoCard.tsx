import { Card, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import classes from "./PhotoCard.module.css";

export type PhotoCardData = {
  readonly id: string;
  readonly caption: string | null;
  readonly alt: string | null;
  readonly storageKey: string;
  readonly thumbnailKey: string | null;
  readonly width: number;
  readonly height: number;
};

export const photoImageUrl = (key: string): string => {
  const m = /^users\/(?<ownerId>[^/]+)\/photos\/(?<photoId>[^/]+)\/(?<file>.+)$/.exec(key);
  return m?.groups ? `/api/i/${m.groups.ownerId}/${m.groups.photoId}/${m.groups.file}` : "";
};

type PhotoCardProps = {
  readonly photo: PhotoCardData;
  readonly albumSlug?: string;
};

export const PhotoCard = ({ photo, albumSlug }: Readonly<PhotoCardProps>) => {
  const src = photoImageUrl(photo.thumbnailKey ?? photo.storageKey);
  const card = (
    <Card withBorder radius="md" padding={0} className={classes.card}>
      <div className={classes.thumb} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <img src={src} alt={photo.alt ?? photo.caption ?? ""} loading="lazy" />
      </div>
      {photo.caption && (
        <Text className={classes.caption} size="sm" truncate px="sm" py="xs">
          {photo.caption}
        </Text>
      )}
    </Card>
  );
  return albumSlug === undefined ? (
    <Link to="/admin/photos/$photoId" params={{ photoId: photo.id }} className={classes.link}>
      {card}
    </Link>
  ) : (
    <Link
      to="/admin/albums/$slug/photos/$photoId"
      params={{ photoId: photo.id, slug: albumSlug }}
      className={classes.link}
    >
      {card}
    </Link>
  );
};
