import { Checkbox, Table, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import { formatDateTime } from "#/lib/format.ts";
import { photoImageUrl } from "#/lib/image-url.ts";

import classes from "./PhotoTable.module.css";

import type { PhotoCardData } from "#/components/PhotoCard";

type PhotoTableProps = {
  photos: PhotoCardData[];
  albumSlug?: string;
  emptyMessage?: string;
  selectedPhotoIds: Set<string>;
  onSelect: (photoId: string) => void;
};

export const PhotoTable = ({
  photos,
  albumSlug,
  emptyMessage = "写真はまだありません",
  selectedPhotoIds,
  onSelect,
}: PhotoTableProps) => {
  if (photos.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {emptyMessage}
      </Text>
    );
  }
  return (
    <Table.ScrollContainer minWidth={640}>
      <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={44} />
            <Table.Th w={72}>写真</Table.Th>
            <Table.Th>キャプション</Table.Th>
            <Table.Th>代替テキスト</Table.Th>
            <Table.Th w={180}>撮影日時</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {photos.map((p) => {
            const selected = selectedPhotoIds.has(p.id);
            const src = photoImageUrl(p.thumbnailKey ?? p.storageKey);
            const label = p.caption ?? "(キャプションなし)";
            return (
              <Table.Tr key={p.id} bg={selected ? "var(--mantine-color-blue-light)" : undefined}>
                <Table.Td>
                  <Checkbox
                    checked={selected}
                    onChange={() => onSelect(p.id)}
                    aria-label={p.caption ?? p.alt ?? "この写真を選択する"}
                  />
                </Table.Td>
                <Table.Td>
                  <img className={classes.thumb} src={src} alt="" loading="lazy" />
                </Table.Td>
                <Table.Td>
                  {albumSlug === undefined ? (
                    <Link
                      to="/admin/photos/$photoId"
                      params={{ photoId: p.id }}
                      className={classes.link}
                    >
                      {label}
                    </Link>
                  ) : (
                    <Link
                      to="/admin/albums/$slug/photos/$photoId"
                      params={{ photoId: p.id, slug: albumSlug }}
                      className={classes.link}
                    >
                      {label}
                    </Link>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {p.alt ?? "—"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {formatDateTime(p.takenAt) ?? "—"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};
