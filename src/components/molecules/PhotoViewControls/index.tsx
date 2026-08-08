import { Group, SegmentedControl } from "@mantine/core";
import {
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  LayoutGridIcon,
  ListIcon,
} from "lucide-react";

type PhotoViewControlsProps = {
  order: "asc" | "desc";
  view: "grid" | "table";
  onOrderChange: (order: "asc" | "desc") => void;
  onViewChange: (view: "grid" | "table") => void;
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
        {
          label: (
            <Group gap={6} wrap="nowrap" justify="center">
              <ArrowDownWideNarrowIcon size={14} />
              新しい順
            </Group>
          ),
          value: "desc",
        },
        {
          label: (
            <Group gap={6} wrap="nowrap" justify="center">
              <ArrowUpNarrowWideIcon size={14} />
              古い順
            </Group>
          ),
          value: "asc",
        },
      ]}
      aria-label="並び順"
    />
    <SegmentedControl
      size="xs"
      value={view}
      onChange={(value) => onViewChange(value === "table" ? "table" : "grid")}
      data={[
        {
          label: (
            <Group gap={6} wrap="nowrap" justify="center">
              <LayoutGridIcon size={14} />
              グリッド
            </Group>
          ),
          value: "grid",
        },
        {
          label: (
            <Group gap={6} wrap="nowrap" justify="center">
              <ListIcon size={14} />
              テーブル
            </Group>
          ),
          value: "table",
        },
      ]}
      aria-label="表示形式"
    />
  </Group>
);
