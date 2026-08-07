import { Group, SegmentedControl, Text } from "@mantine/core";
import { GlobeIcon, LockIcon } from "lucide-react";

type VisibilitySegmentedControlProps = {
  value: "public" | "private";
  onChange: (value: "public" | "private") => void;
  disabled?: boolean;
};

export const VisibilitySegmentedControl = ({
  value,
  onChange,
  disabled,
}: VisibilitySegmentedControlProps) => (
  <Group justify="space-between" align="center" wrap="nowrap">
    <Text size="sm" fw={500}>
      公開状態
    </Text>
    <SegmentedControl
      value={value}
      onChange={(next) => onChange(next === "public" ? "public" : "private")}
      disabled={disabled}
      data={[
        {
          label: (
            <Group gap={6} wrap="nowrap" justify="center">
              <LockIcon size={14} />
              非公開
            </Group>
          ),
          value: "private",
        },
        {
          label: (
            <Group gap={6} wrap="nowrap" justify="center">
              <GlobeIcon size={14} />
              公開
            </Group>
          ),
          value: "public",
        },
      ]}
    />
  </Group>
);
