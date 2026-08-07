import { useEffect, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import classes from "./PhotoLightbox.module.css";

type LightboxPhoto = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
};

type PhotoLightboxProps = {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export const PhotoLightbox = ({ photos, index, onClose, onIndexChange }: PhotoLightboxProps) => {
  const [zoom, setZoom] = useState(1);
  const photo = index === null ? undefined : photos[index];

  // Esc と左右キーでの操作を受け取るため window にイベントを登録する
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (index === null) {
        return;
      }
      if (event.key === "Escape") {
        setZoom(1);
        onClose();
        return;
      }
      let delta = 0;
      if (event.key === "ArrowLeft") {
        delta = -1;
      }
      if (event.key === "ArrowRight") {
        delta = 1;
      }
      if (delta === 0) {
        return;
      }
      setZoom(1);
      onIndexChange((index + delta + photos.length) % photos.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, photos.length, onClose, onIndexChange]);

  // 開いている間は背景のスクロールを止めるため body のスタイルを直接操作する
  useEffect(() => {
    document.body.style.overflow = index === null ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [index]);

  if (index === null || !photo) {
    return null;
  }

  const handleClose = () => {
    setZoom(1);
    onClose();
  };

  const move = (delta: number) => {
    setZoom(1);
    onIndexChange((index + delta + photos.length) % photos.length);
  };

  return (
    <div className={classes.overlay} role="dialog" aria-modal="true" aria-label="写真を表示">
      <button
        type="button"
        className={classes.close}
        onClick={handleClose}
        aria-label="閉じる"
        autoFocus
      >
        <XIcon size={18} />
      </button>

      <div className={classes.stage}>
        <div
          className={classes.canvas}
          style={{ height: `${zoom * 100}%`, width: `${zoom * 100}%` }}
        >
          <img
            className={classes.image}
            src={`/api/i/${photo.storageKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`}
            alt={photo.alt ?? photo.caption ?? ""}
          />
        </div>
      </div>

      <div className={classes.footer}>
        <p className={photo.caption ? classes.caption : classes.captionEmpty}>
          {photo.caption ?? "説明はありません"}
        </p>

        <div className={classes.actions}>
          <div className={classes.group}>
            <button
              type="button"
              className={classes.button}
              onClick={() => move(-1)}
              disabled={photos.length < 2}
            >
              <ChevronLeftIcon size={14} />
              前へ戻る
            </button>
            <span className={classes.counter}>
              {index + 1} / {photos.length}
            </span>
            <button
              type="button"
              className={classes.button}
              onClick={() => move(1)}
              disabled={photos.length < 2}
            >
              次へ進む
              <ChevronRightIcon size={14} />
            </button>
          </div>

          <div className={classes.group}>
            <button
              type="button"
              className={classes.iconButton}
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              disabled={zoom <= 1}
              aria-label="縮小する"
            >
              <ZoomOutIcon size={16} />
            </button>
            <span className={classes.counter}>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className={classes.iconButton}
              onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
              disabled={zoom >= 4}
              aria-label="拡大する"
            >
              <ZoomInIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
