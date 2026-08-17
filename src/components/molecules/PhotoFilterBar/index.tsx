import { useState } from "react";

import { Button, Collapse, Group, Paper, Select, Stack, TextInput } from "@mantine/core";
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
  opened: boolean;
  appliedCount: number;
  onChange: (patch: PhotoFilters) => void;
};

export const PhotoFilterBar = ({
  filters,
  albums,
  cameras,
  opened,
  appliedCount,
  onChange,
}: PhotoFilterBarProps) => {
  const [draft, setDraft] = useState<PhotoFilters>(filters);
  const dirty =
    draft.album !== filters.album ||
    draft.camera !== filters.camera ||
    draft.geo !== filters.geo ||
    draft.missing !== filters.missing ||
    draft.month !== filters.month ||
    draft.q !== filters.q;

  return (
    <Collapse expanded={opened}>
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Group gap="sm" align="flex-end">
            <TextInput
              label="キーワード"
              placeholder="キャプションや代替テキスト"
              leftSection={<SearchIcon size={16} />}
              value={draft.q ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, q: event.currentTarget.value || undefined }))
              }
              w={220}
            />
            <TextInput
              label="撮影年月"
              type="month"
              placeholder="2026-05"
              value={draft.month ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, month: event.currentTarget.value || undefined }))
              }
              w={160}
            />
            <Select
              label="アルバム"
              placeholder="すべて"
              data={[
                { label: "どれにも入っていない", value: "none" },
                ...albums.map((album) => ({ label: album.title ?? "(無題)", value: album.id })),
              ]}
              value={draft.album ?? null}
              onChange={(value) => setDraft((prev) => ({ ...prev, album: value ?? undefined }))}
              clearable
              w={180}
            />
            <Select
              label="カメラ"
              placeholder="すべて"
              data={cameras}
              value={draft.camera ?? null}
              onChange={(value) => setDraft((prev) => ({ ...prev, camera: value ?? undefined }))}
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
              value={draft.geo ?? null}
              onChange={(value) => setDraft((prev) => ({ ...prev, geo: value ?? undefined }))}
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
              value={draft.missing ?? null}
              onChange={(value) => setDraft((prev) => ({ ...prev, missing: value ?? undefined }))}
              clearable
              w={160}
            />
          </Group>

          <Group gap="sm" justify="flex-end">
            <Button
              variant="default"
              leftSection={<XIcon size={16} />}
              disabled={appliedCount === 0 && !dirty}
              onClick={() => {
                const cleared = {
                  album: undefined,
                  camera: undefined,
                  geo: undefined,
                  missing: undefined,
                  month: undefined,
                  q: undefined,
                };
                setDraft(cleared);
                onChange(cleared);
              }}
            >
              条件を消す
            </Button>
            <Button disabled={!dirty} onClick={() => onChange(draft)}>
              適用する
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Collapse>
  );
};
