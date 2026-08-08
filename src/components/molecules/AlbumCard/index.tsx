import { Card, Group, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import { VisibilityIcon } from "#/components/atoms/VisibilityIcon";
import { photoImageUrl } from "#/lib/image-url.ts";

import classes from "./AlbumCard.module.css";

export type AlbumCardData = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  visibility: "public" | "private";
  coverThumbnailKey: string | null;
  coverStorageKey: string | null;
};

export const AlbumCard = ({ album }: { album: AlbumCardData }) => {
  const coverKey = album.coverThumbnailKey ?? album.coverStorageKey;
  return (
    <Link to="/admin/albums/$slug" params={{ slug: album.slug }} className={classes.link}>
      <Card withBorder radius="md" padding={0} className={classes.card}>
        <div className={classes.cover}>
          {coverKey ? (
            <img src={photoImageUrl(coverKey)} alt="" loading="lazy" />
          ) : (
            <div className={classes.placeholder}>
              <Text size="xs" c="dimmed">
                No cover
              </Text>
            </div>
          )}
        </div>
        <Group gap={6} wrap="nowrap" px="sm" py="xs">
          <Text fw={600} truncate style={{ minWidth: 0 }}>
            {album.title ?? "(無題)"}
          </Text>
          <VisibilityIcon visibility={album.visibility} size={14} />
        </Group>
      </Card>
    </Link>
  );
};
