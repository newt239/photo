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
};

export const PublicAlbumGallery = ({ title, description, photos }: PublicAlbumGalleryProps) => (
  <>
    <div className={classes.gallery}>
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
        </a>
      ))}
    </div>
    <div className={classes.overlay}>
      <div className={classes.overlayTitle}>{title ?? "(無題)"}</div>
      {description && <div className={classes.overlayDescription}>{description}</div>}
    </div>
  </>
);
