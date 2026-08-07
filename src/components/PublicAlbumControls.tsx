import { SegmentedControl, Slider } from "@mantine/core";
import { ZoomInIcon, ZoomOutIcon } from "lucide-react";

import classes from "./PublicAlbumControls.module.css";

type PublicAlbumControlsProps = {
  mode: string;
  size: number;
  onModeChange: (mode: string) => void;
  onSizeChange: (size: number) => void;
};

export const PublicAlbumControls = ({
  mode,
  size,
  onModeChange,
  onSizeChange,
}: PublicAlbumControlsProps) => (
  <div className={classes.controls}>
    <SegmentedControl
      size="xs"
      value={mode}
      onChange={onModeChange}
      data={[
        { label: "写真", value: "photo" },
        { label: "地図", value: "map" },
      ]}
    />
    {mode === "photo" && (
      <>
        <ZoomOutIcon size={16} aria-hidden />
        <Slider
          className={classes.slider}
          min={1}
          max={5}
          step={1}
          value={size}
          onChange={onSizeChange}
          label={null}
          thumbLabel="表示サイズ"
        />
        <ZoomInIcon size={16} aria-hidden />
      </>
    )}
  </div>
);
