import { useState } from "react";

import { Button, FileInput, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import type { CountKeysRequest, CountKeysResponse } from "#/lib/json-parser.ts";

const DebugWasmPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ count: number; elapsedMs: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRun = async () => {
    if (!file || running) {
      return;
    }
    setRunning(true);
    setResult(null);
    setErrorMessage(null);
    const worker = new Worker(new URL("../workers/json-parser.worker.ts", import.meta.url), {
      type: "module",
    });
    try {
      const text = await file.text();
      const startedAt = performance.now();
      const count = await new Promise<number>((resolve, reject) => {
        const handleMessage = (event: MessageEvent<CountKeysResponse>) => {
          worker.removeEventListener("error", handleError);
          if (event.data.ok) {
            resolve(event.data.value);
          } else {
            reject(new Error(event.data.error));
          }
        };
        const handleError = (event: ErrorEvent) => {
          worker.removeEventListener("message", handleMessage);
          reject(new Error(event.message));
        };

        worker.addEventListener("message", handleMessage, { once: true });
        worker.addEventListener("error", handleError, { once: true });

        const request: CountKeysRequest = { payload: text, type: "countKeys" };
        worker.postMessage(request);
      });
      setResult({ count, elapsedMs: performance.now() - startedAt });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      worker.terminate();
      setRunning(false);
    }
  };

  return (
    <Stack p="xl" gap="md">
      <Title order={2}>WASM 動作確認</Title>
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <FileInput
            label="JSON ファイル"
            placeholder="ファイルを選択"
            accept="application/json"
            clearable
            value={file}
            onChange={setFile}
          />
          {file && (
            <Text size="sm" c="dimmed">
              サイズ: {(file.size / 1024 / 1024).toFixed(2)} MB
            </Text>
          )}
          {result && (
            <Text size="sm">
              トップレベルの要素数: {result.count} / 解析時間: {result.elapsedMs.toFixed(1)} ms
            </Text>
          )}
          {errorMessage && (
            <Text size="sm" c="red">
              {errorMessage}
            </Text>
          )}
          <Group justify="flex-end">
            <Button onClick={handleRun} loading={running} disabled={!file}>
              解析する
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
};

export const Route = createFileRoute("/admin/debug/wasm")({
  component: DebugWasmPage,
  head: () => ({ meta: [{ title: "WASM 動作確認 | photos.newt239.dev" }] }),
});
