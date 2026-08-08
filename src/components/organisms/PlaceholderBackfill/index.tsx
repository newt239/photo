import { useState } from "react";

import { Button, Group, Text } from "@mantine/core";
import { SparklesIcon } from "lucide-react";

import { photoImageUrl } from "#/lib/image-url.ts";
import { encodeThumbHash } from "#/lib/thumbhash.ts";
import { listPhotosMissingPlaceholder, savePhotoPlaceholders } from "#/server/photos.ts";

export const PlaceholderBackfill = () => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setMessage(null);
    setProgress(null);
    try {
      const listed = await listPhotosMissingPlaceholder({ data: { limit: 1000 } });
      if (!listed.success) {
        setMessage(listed.error);
        return;
      }
      const queue = [...listed.photos];
      const total = queue.length;
      if (total === 0) {
        setMessage("すべての写真にプレースホルダーがあります");
        return;
      }

      const pending: { id: string; placeholder: string }[] = [];
      let done = 0;
      let saved = 0;
      let failed = 0;
      setProgress({ done, total });

      const flush = async () => {
        const items = pending.splice(0);
        if (items.length === 0) {
          return;
        }
        const result = await savePhotoPlaceholders({ data: { items } });
        if (result.success) {
          saved += result.updated;
        } else {
          failed += items.length;
        }
      };

      await Promise.all(
        Array.from({ length: 3 }, async () => {
          for (;;) {
            const target = queue.shift();
            if (!target) {
              return;
            }
            // ブラウザの同時接続を圧迫しないようキューから 1 件ずつ取り出して処理する
            try {
              const response = await fetch(photoImageUrl(target.storageKey, 320));
              const placeholder = response.ok ? await encodeThumbHash(await response.blob()) : null;
              if (placeholder) {
                pending.push({ id: target.id, placeholder });
              } else {
                failed += 1;
              }
            } catch {
              failed += 1;
            }
            done += 1;
            setProgress({ done, total });
            if (pending.length >= 50) {
              await flush();
            }
          }
        }),
      );
      await flush();

      setProgress(null);
      setMessage(
        failed === 0
          ? `${saved} 件のプレースホルダーを生成しました`
          : `${saved} 件のプレースホルダーを生成しました（${failed} 件は失敗しました）`,
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <Group gap="sm">
      <Button
        leftSection={<SparklesIcon size={16} />}
        onClick={() => {
          run();
        }}
        loading={running}
        disabled={running}
      >
        プレースホルダーを生成する
      </Button>
      <Text size="sm" c="dimmed" role="status">
        {progress ? `${progress.done} / ${progress.total} 件を処理しました` : message}
      </Text>
    </Group>
  );
};
