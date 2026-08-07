import { useState } from "react";

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

  if (minimized) {
    return (
      <div className={`${classes.panel} ${classes.collapsed}`}>
        <div className={classes.heading}>
          <div className={classes.title}>{title ?? "(無題)"}</div>
          <button
            type="button"
            className={classes.iconButton}
            onClick={() => setMinimized(false)}
            aria-expanded={false}
            aria-label="アルバムの情報を開く"
          >
            <InfoIcon size={16} />
          </button>
        </div>
      </div>
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

      {(hasGeotagged || mode === "photo") && (
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

          {mode === "photo" && (
            <div className={classes.sizeControl}>
              <button
                type="button"
                className={classes.iconButton}
                onClick={() => onSizeChange(size - 1)}
                disabled={size <= 1}
                aria-label="表示を小さくする"
              >
                <ZoomOutIcon size={16} />
              </button>
              <input
                className={classes.slider}
                type="range"
                min={1}
                max={5}
                step={1}
                value={size}
                onChange={(e) => onSizeChange(Number(e.currentTarget.value))}
                aria-label="表示サイズ"
              />
              <button
                type="button"
                className={classes.iconButton}
                onClick={() => onSizeChange(size + 1)}
                disabled={size >= 5}
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
