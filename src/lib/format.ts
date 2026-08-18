const monthLabel = (value: string) => `${value.slice(0, 4)}年${Number(value.slice(5, 7))}月`;

export const formatAlbumPeriod = (periodStart: string | null, periodEnd: string | null) => {
  if (!periodStart) {
    return null;
  }
  return !periodEnd || periodEnd === periodStart
    ? monthLabel(periodStart)
    : `${monthLabel(periodStart)}〜${monthLabel(periodEnd)}`;
};

export const formatBytes = (bytes: number) => {
  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let unit = "B";
  for (const next of units) {
    if (value < 1024) {
      break;
    }
    value /= 1024;
    unit = next;
  }
  return unit === "B" ? `${value} B` : `${value.toFixed(1)} ${unit}`;
};

export const formatDateTime = (value: Date | string | null) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
