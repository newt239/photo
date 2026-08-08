import { Select } from "@mantine/core";
import { GlobeIcon } from "lucide-react";

type TimeZoneSelectProps = {
  value: string;
  disabled?: boolean;
  onChange: (next: string) => void;
};

export const TimeZoneSelect = ({ value, disabled, onChange }: TimeZoneSelectProps) => (
  <Select
    label="撮影場所のタイムゾーン"
    description="EXIF の撮影日時をこのタイムゾーンの時刻として保存します"
    data={Intl.supportedValuesOf("timeZone")}
    value={value}
    onChange={(next) => {
      if (next) {
        onChange(next);
      }
    }}
    disabled={disabled}
    leftSection={<GlobeIcon size={16} />}
    searchable
    allowDeselect={false}
    maw={360}
  />
);
