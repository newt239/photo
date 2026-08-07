import { useState } from "react";

import { useMasonryColumns } from "#/lib/use-masonry-columns.ts";

import { PhotoLightbox } from "./PhotoLightbox";
import classes from "./PublicAlbumGallery.module.css";

type PublicGalleryPhoto = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
  thumbnailKey: string | null;
  width: number;
  height: number;
};

export const PublicAlbumGallery = ({
  photos,
  size,
}: {
  photos: PublicGalleryPhoto[];
  size: number;
}) => {
  const [index, setIndex] = useState<number | null>(null);
  const { columns, ref } = useMasonryColumns(size * 160);

  return (
    <>
      <div className={classes.gallery} ref={ref}>
        {Array.from({ length: columns }, (_, column) => (
          <div key={column} className={classes.column}>
            {photos.map((p, i) =>
              i % columns === column ? (
                <button
                  key={p.id}
                  type="button"
                  className={classes.item}
                  onClick={() => setIndex(i)}
                  aria-label={p.caption ?? p.alt ?? "写真を拡大する"}
                >
                  <img
                    src={`/api/i/${(p.thumbnailKey ?? p.storageKey).replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`}
                    alt={p.alt ?? p.caption ?? ""}
                    loading="lazy"
                    style={{ aspectRatio: `${p.width} / ${p.height}` }}
                  />
                  {p.caption && <span className={classes.caption}>{p.caption}</span>}
                </button>
              ) : null,
            )}
          </div>
        ))}
      </div>
      <PhotoLightbox
        photos={photos}
        index={index}
        onClose={() => setIndex(null)}
        onIndexChange={setIndex}
      />
    </>
  );
};
