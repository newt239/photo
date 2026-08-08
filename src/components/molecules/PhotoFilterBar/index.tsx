import { useState } from "react";

import { Button, Group, Select, TextInput } from "@mantine/core";
import { SearchIcon, XIcon } from "lucide-react";

export type PhotoFilters = {
  album?: string;
  camera?: string;
  geo?: "with" | "without";
  missing?: "caption" | "alt";
  month?: string;
  q?: string;
};

type PhotoFilterBarProps = {
  filters: PhotoFilters;
  albums: { id: string; title: string | null }[];
  cameras: string[];
  onChange: (patch: PhotoFilters) => void;
};

export const PhotoFilterBar = ({ filters, albums, cameras, onChange }: PhotoFilterBarProps) => {
  const [keyword, setKeyword] = useState(filters.q ?? "");
  const active =
    filters.album !== undefined ||
    filters.camera !== undefined ||
    filters.geo !== undefined ||
    filters.missing !== undefined ||
    filters.month !== undefined ||
    filters.q !== undefined;

  return (
    <Group gap="sm" align="flex-end">
      <TextInput
        label="キーワード"
        description="Enter で検索します"
        placeholder="キャプションや代替テキスト"
        leftSection={<SearchIcon size={16} />}
        value={keyword}
        onChange={(event) => setKeyword(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onChange({ q: keyword.trim() || undefined });
          }
        }}
        w={220}
      />
      <TextInput
        label="撮影年月"
        type="month"
        placeholder="2026-05"
        value={filters.month ?? ""}
        onChange={(event) => onChange({ month: event.currentTarget.value || undefined })}
        w={160}
      />
      <Select
        label="アルバム"
        placeholder="すべて"
        data={[
          { label: "どれにも入っていない", value: "none" },
          ...albums.map((album) => ({ label: album.title ?? "(無題)", value: album.id })),
        ]}
        value={filters.album ?? null}
        onChange={(value) => onChange({ album: value ?? undefined })}
        clearable
        w={180}
      />
      <Select
        label="カメラ"
        placeholder="すべて"
        data={cameras}
        value={filters.camera ?? null}
        onChange={(value) => onChange({ camera: value ?? undefined })}
        clearable
        searchable
        w={180}
      />
      <Select
        label="位置情報"
        placeholder="すべて"
        data={[
          { label: "設定済み", value: "with" },
          { label: "未設定", value: "without" },
        ]}
        value={filters.geo ?? null}
        onChange={(value) =>
          onChange({ geo: value === "with" || value === "without" ? value : undefined })
        }
        clearable
        w={140}
      />
      <Select
        label="未入力の項目"
        placeholder="指定なし"
        data={[
          { label: "キャプション", value: "caption" },
          { label: "代替テキスト", value: "alt" },
        ]}
        value={filters.missing ?? null}
        onChange={(value) =>
          onChange({ missing: value === "caption" || value === "alt" ? value : undefined })
        }
        clearable
        w={160}
      />
      <Button
        variant="default"
        leftSection={<XIcon size={16} />}
        disabled={!active}
        onClick={() => {
          setKeyword("");
          onChange({
            album: undefined,
            camera: undefined,
            geo: undefined,
            missing: undefined,
            month: undefined,
            q: undefined,
          });
        }}
      >
        条件を消す
      </Button>
    </Group>
  );
};
