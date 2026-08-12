import { useState } from "react";

import { Button, Collapse, Group, Paper, Select, Stack, TextInput } from "@mantine/core";
import { SearchIcon, XIcon } from "lucide-react";

export type AlbumFilters = {
  q?: string;
  year?: string;
};

type AlbumFilterBarProps = {
  filters: AlbumFilters;
  years: string[];
  opened: boolean;
  appliedCount: number;
  onChange: (patch: AlbumFilters) => void;
};

export const AlbumFilterBar = ({
  filters,
  years,
  opened,
  appliedCount,
  onChange,
}: AlbumFilterBarProps) => {
  const [draft, setDraft] = useState<AlbumFilters>(filters);
  const dirty = draft.q !== filters.q || draft.year !== filters.year;

  return (
    <Collapse expanded={opened}>
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Group gap="sm" align="flex-end">
            <TextInput
              label="アルバム名"
              placeholder="アルバム名の一部"
              leftSection={<SearchIcon size={16} />}
              value={draft.q ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, q: event.currentTarget.value || undefined }))
              }
              w={220}
            />
            <Select
              label="開始年"
              placeholder="すべて"
              data={years.map((year) => ({ label: `${year}年`, value: year }))}
              value={draft.year ?? null}
              onChange={(value) => setDraft((prev) => ({ ...prev, year: value ?? undefined }))}
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
                const cleared = { q: undefined, year: undefined };
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
