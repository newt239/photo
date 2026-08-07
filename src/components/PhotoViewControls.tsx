import { Group, SegmentedControl } from "@mantine/core";

type PhotoViewControlsProps = {
  order: "asc" | "desc";
  view: "masonry" | "table";
  onOrderChange: (order: "asc" | "desc") => void;
  onViewChange: (view: "masonry" | "table") => void;
};

export const PhotoViewControls = ({
  order,
  view,
  onOrderChange,
  onViewChange,
}: PhotoViewControlsProps) => (
  <Group gap="sm" wrap="nowrap">
    <SegmentedControl
      size="xs"
      value={order}
      onChange={(value) => onOrderChange(value === "asc" ? "asc" : "desc")}
      data={[
        { label: "撮影が新しい順", value: "desc" },
        { label: "撮影が古い順", value: "asc" },
      ]}
      aria-label="並び順"
    />
    <SegmentedControl
      size="xs"
      value={view}
      onChange={(value) => onViewChange(value === "table" ? "table" : "masonry")}
      data={[
        { label: "マソンリー", value: "masonry" },
        { label: "テーブル", value: "table" },
      ]}
      aria-label="表示形式"
    />
  </Group>
);
