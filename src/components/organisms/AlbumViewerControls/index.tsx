import { useEffect, useState } from "react";

import { useThrottledCallback } from "@mantine/hooks";
import { ChevronDownIcon, InfoIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import classes from "./AlbumViewerControls.module.css";

type AlbumViewerControlsProps = {
  title: string;
  period: string | null;
  hasGeotagged: boolean;
  mode: "photo" | "map";
  size: number | undefined;
  onModeChange: (mode: "photo" | "map") => void;
  onSizeChange: (size: number) => void;
};

export const AlbumViewerControls = ({
  title,
  period,
  hasGeotagged,
  mode,
  size,
  onModeChange,
  onSizeChange,
}: AlbumViewerControlsProps) => {
  const [minimized, setMinimized] = useState(true);
  const [viewport, setViewport] = useState(0);

  const update = useThrottledCallback(() => setViewport(window.innerWidth), 100);

  // スライダーの上限と既定値は画面幅から決まるためブラウザ API で計測し resize を監視する
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const maxSize = Math.min(12, Math.max(1, Math.floor(viewport / 120)));
  const current = Math.min(size ?? (viewport <= 480 ? 2 : 3), maxSize);
  const showSize = mode === "photo" && maxSize > 1;

  if (minimized) {
    return (
      <button
        type="button"
        className={`${classes.panel} ${classes.collapsed}`}
        onClick={() => setMinimized(false)}
        aria-expanded={false}
        aria-label="アルバムの情報を開く"
      >
        <div className={classes.heading}>
          <div className={classes.title}>{title}</div>
          <span className={classes.iconButton} aria-hidden>
            <InfoIcon size={16} />
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className={classes.panel}>
      <div className={classes.info}>
        <div className={classes.heading}>
          <div className={classes.title}>{title}</div>
          <button
            type="button"
            className={classes.iconButton}
            onClick={() => setMinimized(true)}
            aria-expanded
            aria-label="アルバムの情報を閉じる"
          >
            <ChevronDownIcon size={16} />
          </button>
        </div>
        {period && <div className={classes.description}>{period}</div>}
      </div>

      {(hasGeotagged || showSize) && (
        <div className={classes.row}>
          {showSize && (
            <div className={classes.sizeControl}>
              <button
                type="button"
                className={classes.iconButton}
                onClick={() => onSizeChange(current + 1)}
                disabled={current >= maxSize}
                aria-label="表示を小さくする"
              >
                <ZoomOutIcon size={16} />
              </button>
              <input
                className={classes.slider}
                type="range"
                min={1}
                max={maxSize}
                step={1}
                value={maxSize + 1 - current}
                onChange={(e) => onSizeChange(maxSize + 1 - Number(e.currentTarget.value))}
                aria-label="表示サイズ"
                aria-valuetext={`${current} 列`}
              />
              <button
                type="button"
                className={classes.iconButton}
                onClick={() => onSizeChange(current - 1)}
                disabled={current <= 1}
                aria-label="表示を大きくする"
              >
                <ZoomInIcon size={16} />
              </button>
            </div>
          )}

          {hasGeotagged && (
            <div className={classes.segmented}>
              <button
                type="button"
                className={classes.segment}
                data-active={mode === "photo" || undefined}
                onClick={() => onModeChange("photo")}
              >
                写真
              </button>
              <button
                type="button"
                className={classes.segment}
                data-active={mode === "map" || undefined}
                onClick={() => onModeChange("map")}
              >
                地図
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
