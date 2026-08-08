import { FocusTrap, Portal, RemoveScroll } from "@mantine/core";
import { useFocusReturn, useHotkeys } from "@mantine/hooks";
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import { photoImageUrl } from "#/lib/image-url.ts";
import { usePhotoZoom } from "#/lib/photo-zoom.ts";

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
  const photo = index === null ? undefined : photos[index];
  const { canvasRef, reset, scale, stageProps, stageRef, transform, zoomTo } = usePhotoZoom(
    photo?.id ?? null,
  );

  const handleClose = () => {
    reset();
    onClose();
  };

  const move = (delta: number) => {
    if (index === null) {
      return;
    }
    reset();
    onIndexChange((index + delta + photos.length) % photos.length);
  };

  const jumpTo = (next: number) => {
    if (index === null) {
      return;
    }
    reset();
    onIndexChange(next);
  };

  useHotkeys([
    ["-", () => index !== null && zoomTo(scale / 1.5)],
    ["0", () => index !== null && reset()],
    ["=", () => index !== null && zoomTo(scale * 1.5)],
    ["ArrowLeft", () => move(-1)],
    ["ArrowRight", () => move(1)],
    ["End", () => jumpTo(photos.length - 1)],
    ["Escape", () => index !== null && handleClose()],
    ["Home", () => jumpTo(0)],
    ["shift+=", () => index !== null && zoomTo(scale * 1.5)],
  ]);

  useFocusReturn({ opened: index !== null });

  if (index === null || !photo) {
    return null;
  }

  return (
    <Portal>
      <RemoveScroll>
        <FocusTrap active>
          <div className={classes.overlay} role="dialog" aria-modal="true" aria-label="写真を表示">
            <button
              type="button"
              className={classes.close}
              onClick={handleClose}
              aria-label="閉じる"
              data-autofocus
            >
              <XIcon size={18} />
            </button>

            <div ref={stageRef} className={classes.stage} {...stageProps}>
              <div ref={canvasRef} className={classes.canvas} style={{ transform }}>
                <img
                  className={classes.image}
                  src={photoImageUrl(photo.storageKey, 2048)}
                  alt={photo.alt ?? photo.caption ?? ""}
                  draggable={false}
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
                    aria-label="前の写真を表示する"
                  >
                    <ChevronLeftIcon size={14} />
                    <span className={classes.buttonLabel}>前へ戻る</span>
                  </button>
                  <span className={classes.counter}>
                    {index + 1} / {photos.length}
                  </span>
                  <button
                    type="button"
                    className={classes.button}
                    onClick={() => move(1)}
                    disabled={photos.length < 2}
                    aria-label="次の写真を表示する"
                  >
                    <span className={classes.buttonLabel}>次へ進む</span>
                    <ChevronRightIcon size={14} />
                  </button>
                </div>

                <div className={`${classes.group} ${classes.zoomGroup}`}>
                  <button
                    type="button"
                    className={classes.iconButton}
                    onClick={() => zoomTo(scale / 1.5)}
                    disabled={scale <= 0.25}
                    aria-label="縮小する"
                  >
                    <ZoomOutIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className={classes.zoomReset}
                    onClick={reset}
                    aria-label="等倍に戻す"
                  >
                    {Math.round(scale * 100)}%
                  </button>
                  <button
                    type="button"
                    className={classes.iconButton}
                    onClick={() => zoomTo(scale * 1.5)}
                    disabled={scale >= 4}
                    aria-label="拡大する"
                  >
                    <ZoomInIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FocusTrap>
      </RemoveScroll>
    </Portal>
  );
};
