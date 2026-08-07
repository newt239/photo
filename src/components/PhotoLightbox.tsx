import { useEffect, useRef, useState } from "react";

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
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const viewRef = useRef({ scale: 1, x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    distance: number;
    midX: number;
    midY: number;
    scale: number;
    x: number;
    y: number;
  } | null>(null);
  const panRef = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const photo = index === null ? undefined : photos[index];

  const commit = (scale: number, x: number, y: number) => {
    const stage = stageRef.current;
    const clamped = Math.min(4, Math.max(0.25, scale));
    const maxX = stage ? Math.max(0, (stage.clientWidth * (clamped - 1)) / 2) : 0;
    const maxY = stage ? Math.max(0, (stage.clientHeight * (clamped - 1)) / 2) : 0;
    const next = {
      scale: clamped,
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
    viewRef.current = next;
    setView(next);
  };

  const zoomTo = (scale: number, anchor?: { x: number; y: number }) => {
    const stage = stageRef.current;
    const { current } = viewRef;
    if (!stage) {
      commit(scale, current.x, current.y);
      return;
    }
    const rect = stage.getBoundingClientRect();
    const anchorX = anchor ? anchor.x - rect.left - rect.width / 2 : 0;
    const anchorY = anchor ? anchor.y - rect.top - rect.height / 2 : 0;
    const next = Math.min(4, Math.max(0.25, scale));
    commit(
      next,
      anchorX - ((anchorX - current.x) / current.scale) * next,
      anchorY - ((anchorY - current.y) / current.scale) * next,
    );
  };

  const startPinch = () => {
    const points = [...pointersRef.current.values()];
    const [a, b] = points;
    if (!a || !b) {
      return;
    }
    const { current } = viewRef;
    pinchRef.current = {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
      scale: current.scale,
      x: current.x,
      y: current.y,
    };
    panRef.current = null;
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    const [remaining] = [...pointersRef.current.values()];
    const { current } = viewRef;
    panRef.current = remaining
      ? { pointerX: remaining.x, pointerY: remaining.y, x: current.x, y: current.y }
      : null;
  };

  // Esc と左右キーでの操作を受け取るため window にイベントを登録する
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (index === null) {
        return;
      }
      if (event.key === "Escape") {
        commit(1, 0, 0);
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
      commit(1, 0, 0);
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

  // React の onWheel は passive で登録され preventDefault が効かないため直接登録する
  useEffect(() => {
    const stage = stageRef.current;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomTo(viewRef.current.scale * Math.exp(-event.deltaY / 300), {
        x: event.clientX,
        y: event.clientY,
      });
    };
    stage?.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage?.removeEventListener("wheel", handleWheel);
  }, [index]);

  if (index === null || !photo) {
    return null;
  }

  const handleClose = () => {
    commit(1, 0, 0);
    onClose();
  };

  const move = (delta: number) => {
    commit(1, 0, 0);
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

      <div
        ref={stageRef}
        className={classes.stage}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointersRef.current.size >= 2) {
            startPinch();
            return;
          }
          const { current } = viewRef;
          panRef.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            x: current.x,
            y: current.y,
          };
        }}
        onPointerMove={(event) => {
          const pointers = pointersRef.current;
          if (!pointers.has(event.pointerId)) {
            return;
          }
          pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
          const stage = stageRef.current;
          const pinch = pinchRef.current;
          if (pinch && stage) {
            const [a, b] = [...pointers.values()];
            if (!a || !b) {
              return;
            }
            const rect = stage.getBoundingClientRect();
            const scale = Math.min(
              4,
              Math.max(0.25, (pinch.scale * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.distance),
            );
            const originX = (pinch.midX - rect.left - rect.width / 2 - pinch.x) / pinch.scale;
            const originY = (pinch.midY - rect.top - rect.height / 2 - pinch.y) / pinch.scale;
            commit(
              scale,
              (a.x + b.x) / 2 - rect.left - rect.width / 2 - originX * scale,
              (a.y + b.y) / 2 - rect.top - rect.height / 2 - originY * scale,
            );
            return;
          }
          const pan = panRef.current;
          if (pan) {
            commit(
              viewRef.current.scale,
              pan.x + (event.clientX - pan.pointerX),
              pan.y + (event.clientY - pan.pointerY),
            );
          }
        }}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <div
          className={classes.canvas}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          <img
            className={classes.image}
            src={`/api/i/${photo.storageKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`}
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
              onClick={() => zoomTo(view.scale / 1.5)}
              disabled={view.scale <= 0.25}
              aria-label="縮小する"
            >
              <ZoomOutIcon size={16} />
            </button>
            <button
              type="button"
              className={classes.zoomReset}
              onClick={() => commit(1, 0, 0)}
              aria-label="等倍に戻す"
            >
              {Math.round(view.scale * 100)}%
            </button>
            <button
              type="button"
              className={classes.iconButton}
              onClick={() => zoomTo(view.scale * 1.5)}
              disabled={view.scale >= 4}
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
