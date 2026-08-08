import { useState } from "react";

import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Paper,
  Progress,
  Stack,
  Table,
  Text,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useRouter } from "@tanstack/react-router";
import { EraserIcon, SaveIcon, SparklesIcon } from "lucide-react";

import { extractExif, generateThumbnail, probeDimensions } from "#/lib/image.ts";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "#/lib/upload-constraints.ts";
import { generatePhotoDraft } from "#/server/photo-draft.ts";
import { createPhotoUpload, finalizePhoto, updatePhoto } from "#/server/photos.ts";

type UploadState = {
  id: string;
  name: string;
  status: "queued" | "preparing" | "uploading" | "saving" | "done" | "error";
  progress: number;
  error?: string;
  photoId?: string;
  thumbUrl?: string;
  caption: string;
  alt: string;
  saved?: boolean;
  generating?: "caption" | "alt";
};

const putToR2 = async (url: string, body: Blob, contentType: string) => {
  const res = await fetch(url, {
    body,
    headers: { "Content-Type": contentType },
    method: "PUT",
  });
  if (!res.ok) {
    throw new Error(`R2_PUT_FAILED_${res.status}`);
  }
};

export const UploadDropzone = ({ onComplete }: { onComplete?: (photoIds: string[]) => void }) => {
  const [items, setItems] = useState<UploadState[]>([]);
  const [busy, setBusy] = useState(false);
  const [generatingField, setGeneratingField] = useState<"caption" | "alt" | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const router = useRouter();
  const editableCount = items.filter((it) => it.status === "done" && it.photoId).length;
  const unsavedCount = items.filter((it) => it.status === "done" && it.photoId && !it.saved).length;
  const preview = items.find((it) => it.id === previewId);

  const updateItem = (id: string, patch: Partial<UploadState>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const uploadOne = async (file: File, id: string) => {
    const contentType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(contentType as (typeof ALLOWED_MIME_TYPES)[number])) {
      updateItem(id, { error: `非対応の形式: ${contentType}`, status: "error" });
      return null;
    }
    try {
      updateItem(id, { progress: 5, status: "preparing" });
      const [dims, exif, thumb] = await Promise.all([
        probeDimensions(file),
        extractExif(file),
        generateThumbnail(file),
      ]);
      if (thumb) {
        updateItem(id, { thumbUrl: URL.createObjectURL(thumb) });
      }

      updateItem(id, { progress: 25 });
      const prep = await createPhotoUpload({
        data: {
          contentType: contentType as (typeof ALLOWED_MIME_TYPES)[number],
          hasThumbnail: Boolean(thumb),
          size: file.size,
        },
      });
      if (!prep.success) {
        updateItem(id, { error: prep.error, status: "error" });
        return null;
      }

      updateItem(id, { progress: 40, status: "uploading" });
      await putToR2(prep.originalUrl, file, contentType);

      if (thumb && prep.thumbnailUrl) {
        updateItem(id, { progress: 70 });
        await putToR2(prep.thumbnailUrl, thumb, "image/webp");
      }

      updateItem(id, { progress: 85, status: "saving" });
      const saved = await finalizePhoto({
        data: {
          fileSize: file.size,
          height: dims.height,
          mimeType: contentType as (typeof ALLOWED_MIME_TYPES)[number],
          originalKey: prep.originalKey,
          photoId: prep.photoId,
          thumbnailKey: prep.thumbnailKey,
          width: dims.width,
          ...exif,
        },
      });
      if (!saved.success) {
        updateItem(id, { error: saved.error, status: "error" });
        return null;
      }

      updateItem(id, { photoId: prep.photoId, progress: 100, status: "done" });
      return prep.photoId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateItem(id, { error: message, status: "error" });
      return null;
    }
  };

  const handleDrop = async (files: File[]) => {
    const batch: { file: File; item: UploadState }[] = files.map((file) => ({
      file,
      item: {
        alt: "",
        caption: "",
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        progress: 0,
        status: "queued",
      },
    }));
    setItems((prev) => [...prev, ...batch.map((b) => b.item)]);
    setBusy(true);
    try {
      const uploadedIds: string[] = [];
      for (const { file, item } of batch) {
        // 進捗表示と負荷抑制のため意図的に 1 件ずつ逐次アップロードする
        const photoId = await uploadOne(file, item.id);
        if (photoId) {
          uploadedIds.push(photoId);
        }
      }
      await router.invalidate();
      onComplete?.(uploadedIds);
    } finally {
      setBusy(false);
    }
  };

  const generateOne = async (id: string, photoId: string, field: "caption" | "alt") => {
    updateItem(id, { error: undefined, generating: field });
    try {
      const result = await generatePhotoDraft({ data: { fields: [field], id: photoId } });
      if (result.success) {
        updateItem(id, {
          generating: undefined,
          saved: false,
          ...(field === "caption" ? { caption: result.caption ?? "" } : { alt: result.alt ?? "" }),
        });
      } else {
        updateItem(id, { error: result.error, generating: undefined });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateItem(id, { error: message, generating: undefined });
    }
  };

  const generateAll = async (field: "caption" | "alt") => {
    const queue = items.flatMap((it) =>
      it.status === "done" && it.photoId ? [{ id: it.id, photoId: it.photoId }] : [],
    );
    if (queue.length === 0 || generatingField) {
      return;
    }
    setGeneratingField(field);
    try {
      await Promise.all(
        Array.from({ length: 3 }, async () => {
          for (;;) {
            const target = queue.shift();
            if (!target) {
              return;
            }
            // AI の同時実行を 3 件までに抑えるためキューから 1 件ずつ取り出して処理する
            await generateOne(target.id, target.photoId, field);
          }
        }),
      );
    } finally {
      setGeneratingField(null);
    }
  };

  const saveAll = async () => {
    const targets = items.flatMap((it) =>
      it.status === "done" && it.photoId && !it.saved
        ? [{ alt: it.alt, caption: it.caption, id: it.id, photoId: it.photoId }]
        : [],
    );
    if (targets.length === 0 || savingAll) {
      return;
    }
    setSavingAll(true);
    try {
      await Promise.all(
        targets.map(async (target) => {
          updateItem(target.id, { error: undefined, saved: false });
          try {
            const result = await updatePhoto({
              data: {
                alt: target.alt.trim() || null,
                caption: target.caption.trim() || null,
                id: target.photoId,
              },
            });
            if (result.success) {
              updateItem(target.id, { saved: true });
            } else {
              updateItem(target.id, { error: result.error });
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            updateItem(target.id, { error: message });
          }
        }),
      );
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <Stack gap="md">
      <Dropzone
        onDrop={handleDrop}
        onReject={(rejections) => {
          console.warn("rejected files", rejections);
        }}
        accept={IMAGE_MIME_TYPE}
        maxSize={MAX_FILE_SIZE}
        loading={busy}
        multiple
      >
        <Group justify="center" mih={160} style={{ pointerEvents: "none" }}>
          <Stack align="center" gap={4}>
            <Text size="xl" fw={600}>
              画像をドラッグ&ドロップ
            </Text>
            <Text size="sm" c="dimmed">
              {`JPEG / PNG / WebP / AVIF / HEIC、1 ファイル ${MAX_FILE_SIZE / 1024 / 1024} MB まで`}
            </Text>
          </Stack>
        </Group>
      </Dropzone>

      {items.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Group justify="space-between" gap="sm">
              <Group gap="sm">
                <Text size="xs" c="dimmed">
                  写真をクリックすると大きく表示します
                </Text>
                {unsavedCount > 0 && (
                  <Text size="xs" c="dimmed">
                    未保存の写真が {unsavedCount} 件あります
                  </Text>
                )}
              </Group>
              <Group gap="sm">
                <Button
                  variant="default"
                  leftSection={<EraserIcon size={16} />}
                  onClick={() => setItems([])}
                  disabled={busy || savingAll || generatingField !== null}
                >
                  履歴を消去する
                </Button>
                <Button
                  leftSection={<SaveIcon size={16} />}
                  onClick={() => {
                    saveAll();
                  }}
                  loading={savingAll}
                  disabled={generatingField !== null || unsavedCount === 0}
                >
                  保存する
                </Button>
              </Group>
            </Group>
            <Table.ScrollContainer minWidth={720}>
              <Table verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={72}>写真</Table.Th>
                    <Table.Th w={200}>ファイル</Table.Th>
                    <Table.Th>
                      <Group gap="xs" wrap="nowrap" justify="space-between">
                        キャプション
                        <Button
                          size="compact-xs"
                          variant="light"
                          leftSection={<SparklesIcon size={12} />}
                          onClick={() => {
                            generateAll("caption");
                          }}
                          loading={generatingField === "caption"}
                          disabled={
                            busy || savingAll || generatingField === "alt" || editableCount === 0
                          }
                        >
                          まとめて生成する
                        </Button>
                      </Group>
                    </Table.Th>
                    <Table.Th>
                      <Group gap="xs" wrap="nowrap" justify="space-between">
                        代替テキスト
                        <Button
                          size="compact-xs"
                          variant="light"
                          leftSection={<SparklesIcon size={12} />}
                          onClick={() => {
                            generateAll("alt");
                          }}
                          loading={generatingField === "alt"}
                          disabled={
                            busy ||
                            savingAll ||
                            generatingField === "caption" ||
                            editableCount === 0
                          }
                        >
                          まとめて生成する
                        </Button>
                      </Group>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.map((it) => {
                    const { photoId } = it;
                    const editable = it.status === "done" && Boolean(photoId);
                    return (
                      <Table.Tr key={it.id}>
                        <Table.Td>
                          {it.thumbUrl && (
                            <UnstyledButton
                              onClick={() => setPreviewId(it.id)}
                              aria-label={`${it.name} を大きく表示する`}
                              style={{ cursor: "zoom-in", display: "block" }}
                            >
                              <img
                                src={it.thumbUrl}
                                alt={it.name}
                                width={56}
                                height={56}
                                style={{ borderRadius: 6, display: "block", objectFit: "cover" }}
                              />
                            </UnstyledButton>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={4}>
                            <Text size="sm" truncate maw={180}>
                              {it.name}
                            </Text>
                            <Text size="xs" c="dimmed" role="status">
                              {STATUS_LABEL[it.status]}
                            </Text>
                            {it.status !== "done" && (
                              <Progress
                                value={it.progress}
                                color={it.status === "error" ? "red" : undefined}
                              />
                            )}
                            {it.generating && (
                              <Text size="xs" c="blue">
                                AIで生成中
                              </Text>
                            )}
                            {it.saved && !it.generating && (
                              <Text size="xs" c="teal">
                                保存しました
                              </Text>
                            )}
                            {it.error && (
                              <Text size="xs" c="red" role="alert">
                                {it.error}
                              </Text>
                            )}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Textarea
                            value={it.caption}
                            onChange={(e) =>
                              updateItem(it.id, { caption: e.currentTarget.value, saved: false })
                            }
                            disabled={!editable || it.generating === "caption"}
                            autosize
                            minRows={1}
                            maxLength={2000}
                            rightSection={
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                aria-label="キャプションをAIで生成する"
                                onClick={() => {
                                  if (photoId) {
                                    generateOne(it.id, photoId, "caption");
                                  }
                                }}
                                loading={it.generating === "caption"}
                                disabled={
                                  !editable || generatingField !== null || it.generating === "alt"
                                }
                              >
                                <SparklesIcon size={14} />
                              </ActionIcon>
                            }
                            rightSectionPointerEvents="all"
                            rightSectionProps={{
                              style: { alignItems: "flex-start", paddingTop: 4 },
                            }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Textarea
                            value={it.alt}
                            onChange={(e) =>
                              updateItem(it.id, { alt: e.currentTarget.value, saved: false })
                            }
                            disabled={!editable || it.generating === "alt"}
                            autosize
                            minRows={1}
                            maxLength={500}
                            rightSection={
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                aria-label="代替テキストをAIで生成する"
                                onClick={() => {
                                  if (photoId) {
                                    generateOne(it.id, photoId, "alt");
                                  }
                                }}
                                loading={it.generating === "alt"}
                                disabled={
                                  !editable ||
                                  generatingField !== null ||
                                  it.generating === "caption"
                                }
                              >
                                <SparklesIcon size={14} />
                              </ActionIcon>
                            }
                            rightSectionPointerEvents="all"
                            rightSectionProps={{
                              style: { alignItems: "flex-start", paddingTop: 4 },
                            }}
                          />
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Paper>
      )}

      <Modal
        opened={preview !== undefined}
        onClose={() => setPreviewId(null)}
        title={preview?.name}
        size="xl"
        centered
      >
        {preview?.thumbUrl && (
          <img
            src={preview.thumbUrl}
            alt={preview.name}
            style={{
              borderRadius: 8,
              display: "block",
              height: "auto",
              margin: "0 auto",
              maxHeight: "75vh",
              maxWidth: "100%",
            }}
          />
        )}
      </Modal>
    </Stack>
  );
};

const STATUS_LABEL: Record<UploadState["status"], string> = {
  done: "完了",
  error: "エラー",
  preparing: "前処理中",
  queued: "待機中",
  saving: "保存中",
  uploading: "アップロード中",
};
