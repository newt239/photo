import { useMemo, useState } from "react";

import { Link } from "@tanstack/react-router";
import { LayoutGridIcon, Share2Icon } from "lucide-react";
import { thumbHashToDataURL } from "thumbhash";

import { PhotoLightbox } from "#/components/organisms/PhotoLightbox";
import { photoImageUrl } from "#/lib/image-url.ts";
import { masonryLayout, useContainerWidth } from "#/lib/masonry.ts";
import { IMAGE_WIDTHS } from "#/lib/upload-constraints.ts";

import classes from "./PhotoGallery.module.css";

const EAGER_COUNT = 6;

type PhotoGalleryItem = {
  id: string;
  caption: string | null;
  alt: string | null;
  placeholder: string | null;
  storageKey: string;
  width: number;
  height: number;
};

export const PhotoGallery = ({
  photos,
  size,
}: {
  photos: PhotoGalleryItem[];
  size: number | undefined;
}) => {
  const [index, setIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const { ref, width } = useContainerWidth();
  // 計測前は既定値で描画し、マウント後に画面幅で既定値と上限を決める
  const columns =
    width === 0
      ? (size ?? 3)
      : Math.min(size ?? (width <= 480 ? 2 : 3), Math.max(1, Math.floor(width / 120)));
  const layout = masonryLayout(photos, columns);
  const columnPx = width === 0 ? 0 : Math.round(width / columns);
  const blurs = useMemo(
    () =>
      photos.map((p) =>
        p.placeholder
          ? thumbHashToDataURL(Uint8Array.from(atob(p.placeholder), (c) => c.codePointAt(0) ?? 0))
          : null,
      ),
    [photos],
  );

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
          <div
            className={classes.canvas}
            style={{ height: `${(layout.totalHeight * 100) / columns}cqw` }}
          >
            {layout.items.map((p, i) => {
              const candidates = IMAGE_WIDTHS.filter((candidate) => candidate <= p.width);
              const srcSet =
                columnPx > 0 && candidates.length > 0
                  ? candidates
                      .map((candidate) => `${photoImageUrl(p.storageKey, candidate)} ${candidate}w`)
                      .join(", ")
                  : undefined;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={classes.item}
                  onClick={() => setIndex(i)}
                  aria-label={p.alt ?? p.caption ?? "写真を拡大する"}
                  style={{
                    left: `${(p.column * 100) / columns}%`,
                    top: `${(p.top * 100) / columns}cqw`,
                    width: `${100 / columns}%`,
                  }}
                >
                  <img
                    src={photoImageUrl(p.storageKey, 1024)}
                    srcSet={srcSet}
                    sizes={srcSet ? `${columnPx}px` : undefined}
                    alt=""
                    loading={i < EAGER_COUNT ? "eager" : "lazy"}
                    fetchPriority={i < EAGER_COUNT ? "high" : undefined}
                    decoding="async"
                    style={{
                      aspectRatio: `${p.width} / ${p.height}`,
                      backgroundImage: blurs[i] ? `url(${blurs[i]})` : undefined,
                      backgroundSize: "cover",
                    }}
                  />
                  {p.caption && <span className={classes.caption}>{p.caption}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <nav className={classes.footer}>
          <Link className={classes.footerLink} to="/">
            <LayoutGridIcon size={14} />
            アルバム一覧を見る
          </Link>
          <button type="button" className={classes.footerLink} onClick={handleShare}>
            <Share2Icon size={14} />
            <span role="status">{copied ? "URL をコピーしました" : "このページをシェアする"}</span>
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
