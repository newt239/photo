import { useState, useTransition } from "react";

import { Button, Group, Text } from "@mantine/core";
import { FingerprintIcon } from "lucide-react";

import { backfillContentHashes } from "#/server/photos.ts";

export const ContentHashBackfill = () => {
  const [pending, startTransition] = useTransition();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = () => {
    startTransition(async () => {
      setErrorMessage(null);
      try {
        const result = await backfillContentHashes({ data: {} });
        if (result.success) {
          setRemaining(result.remaining);
        } else {
          setErrorMessage(result.error);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : String(error));
      }
    });
  };

  return (
    <>
      <Text size="sm" c="dimmed">
        以前にアップロードした写真には重複判定に使うハッシュがありません。残りが 0
        になるまで繰り返し実行してください。
      </Text>
      <Group gap="sm">
        <Button
          variant="default"
          leftSection={<FingerprintIcon size={16} />}
          onClick={run}
          loading={pending}
          disabled={pending || remaining === 0}
        >
          ハッシュを計算する
        </Button>
        {remaining !== null && (
          <Text size="sm" c={remaining === 0 ? "teal" : "dimmed"} role="status">
            {remaining === 0 ? "すべての写真に設定しました" : `残り ${remaining} 件`}
          </Text>
        )}
      </Group>
      {errorMessage && (
        <Text size="sm" c="red" role="alert">
          {errorMessage}
        </Text>
      )}
    </>
  );
};
