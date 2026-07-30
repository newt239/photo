import { useState } from "react";

import { Anchor, Button, FileInput, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { countTopLevelKeys, createJsonParserWorker } from "#/lib/json-parser.ts";

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
    const worker = createJsonParserWorker();
    try {
      const text = await file.text();
      const startedAt = performance.now();
      const count = await countTopLevelKeys(worker, text);
      setResult({ count, elapsedMs: performance.now() - startedAt });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      worker.terminate();
      setRunning(false);
    }
  };

  return (
    <Stack p="xl" gap="md" maw={680} mx="auto">
      <Anchor component={Link} to="/admin" size="sm">
        ← ホーム
      </Anchor>
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
  head: () => ({ meta: [{ title: "WASM 動作確認 | Photo" }] }),
});
