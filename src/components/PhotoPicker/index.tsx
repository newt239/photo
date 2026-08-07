import { Checkbox, SimpleGrid } from "@mantine/core";

import { photoImageUrl } from "#/lib/image-url.ts";

import classes from "./PhotoPicker.module.css";

export type PhotoPickerItem = {
  id: string;
  caption: string | null;
  storageKey: string;
  thumbnailKey: string | null;
};

type PhotoPickerProps = {
  photos: PhotoPickerItem[];
  disabledPhotoIds: Set<string>;
  selectedPhotoIds: Set<string>;
  onToggle: (photoId: string) => void;
};

export const PhotoPicker = ({
  photos,
  disabledPhotoIds,
  selectedPhotoIds,
  onToggle,
}: PhotoPickerProps) => (
  <SimpleGrid cols={{ base: 3, md: 6, sm: 4 }} spacing="sm">
    {photos.map((p) => {
      const already = disabledPhotoIds.has(p.id);
      const checked = selectedPhotoIds.has(p.id);
      return (
        <label
          key={p.id}
          className={classes.thumb}
          data-checked={checked || undefined}
          data-disabled={already || undefined}
        >
          <img src={photoImageUrl(p.thumbnailKey ?? p.storageKey)} alt="" loading="lazy" />
          <Checkbox
            className={classes.check}
            checked={already || checked}
            disabled={already}
            onChange={() => onToggle(p.id)}
            aria-label={p.caption ?? p.id}
          />
        </label>
      );
    })}
  </SimpleGrid>
);
