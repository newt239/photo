import { useEffect, useState } from "react";

import { ChevronDownIcon, InfoIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import classes from "./PublicAlbumControls.module.css";

type PublicAlbumControlsProps = {
  title: string | null;
  description: string | null;
  hasGeotagged: boolean;
  mode: string;
  size: number;
  onModeChange: (mode: string) => void;
  onSizeChange: (size: number) => void;
};

export const PublicAlbumControls = ({
  title,
  description,
  hasGeotagged,
  mode,
  size,
  onModeChange,
  onSizeChange,
}: PublicAlbumControlsProps) => {
  const [minimized, setMinimized] = useState(false);
  const [maxSize, setMaxSize] = useState(1);

  // 画面幅はブラウザ API でしか取得できないため resize を監視して最大列数を求める
  useEffect(() => {
    const update = () => setMaxSize(Math.max(1, Math.floor(window.innerWidth / 160)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const current = Math.min(size, maxSize);

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
          <div className={classes.title}>{title ?? "(無題)"}</div>
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
          <div className={classes.title}>{title ?? "(無題)"}</div>
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
        {description && <div className={classes.description}>{description}</div>}
      </div>

      {(hasGeotagged || (mode === "photo" && maxSize > 1)) && (
        <div className={classes.row}>
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

          {mode === "photo" && maxSize > 1 && (
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
        </div>
      )}
    </div>
  );
};
