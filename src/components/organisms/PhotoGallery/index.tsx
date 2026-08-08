import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { LayoutGridIcon, Share2Icon } from "lucide-react";

import { PhotoLightbox } from "#/components/organisms/PhotoLightbox";
import { photoImageUrl } from "#/lib/image-url.ts";
import { useMasonryColumns } from "#/lib/use-masonry-columns.ts";

import classes from "./PhotoGallery.module.css";

type PhotoGalleryItem = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
  thumbnailKey: string | null;
  width: number;
  height: number;
};

export const PhotoGallery = ({ photos, size }: { photos: PhotoGalleryItem[]; size: number }) => {
  const [index, setIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const { columns: maxColumns, ref, width } = useMasonryColumns(160);
  const columns = width > 0 && width <= 480 ? 2 : Math.min(size, maxColumns);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({ title: document.title, url });
      return;
    } catch (error) {
      // 共有シートのキャンセルは正常系なので何もせず終える
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }
    // 共有 API が使えない環境ではクリップボードにコピーする
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className={classes.page}>
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
                      src={photoImageUrl(p.thumbnailKey ?? p.storageKey)}
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
        <nav className={classes.footer}>
          <Link className={classes.footerLink} to="/">
            <LayoutGridIcon size={14} />
            アルバム一覧を見る
          </Link>
          <button type="button" className={classes.footerLink} onClick={handleShare}>
            <Share2Icon size={14} />
            {copied ? "URL をコピーしました" : "このページをシェアする"}
          </button>
        </nav>
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
