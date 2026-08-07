import { useState } from "react";

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

type PublicAlbumGalleryProps = {
  title: string | null;
  description: string | null;
  photos: PublicGalleryPhoto[];
  size: number;
};

export const PublicAlbumGallery = ({
  title,
  description,
  photos,
  size,
}: PublicAlbumGalleryProps) => {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div className={classes.gallery} style={{ columnWidth: `${size * 160}px` }}>
        {photos.map((p, i) => (
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
        ))}
      </div>
      <div className={classes.overlay}>
        <div className={classes.overlayTitle}>{title ?? "(無題)"}</div>
        {description && <div className={classes.overlayDescription}>{description}</div>}
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
