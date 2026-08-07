import { useState } from "react";

import { Button, Group, Paper, Progress, Stack, Table, Text, Textarea } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useRouter } from "@tanstack/react-router";

import { extractExif, generateThumbnail, probeDimensions } from "#/lib/image.ts";
import { createPhotoUpload, finalizePhoto, updatePhoto } from "#/server/photos.ts";

const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

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
  const [bulkCaption, setBulkCaption] = useState("");
  const [bulkAlt, setBulkAlt] = useState("");
  const [savingAll, setSavingAll] = useState(false);
  const router = useRouter();
  const editableCount = items.filter((it) => it.status === "done" && it.photoId).length;

  const updateItem = (id: string, patch: Partial<UploadState>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const uploadOne = async (file: File, id: string) => {
    const contentType = file.type.toLowerCase();
    if (!ACCEPTED_MIME.includes(contentType as (typeof ACCEPTED_MIME)[number])) {
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
          contentType: contentType as (typeof ACCEPTED_MIME)[number],
          hasThumbnail: Boolean(thumb),
          size: file.size,
        },
      });

      updateItem(id, { progress: 40, status: "uploading" });
      await putToR2(prep.originalUrl, file, contentType);

      if (thumb && prep.thumbnailUrl) {
        updateItem(id, { progress: 70 });
        await putToR2(prep.thumbnailUrl, thumb, "image/webp");
      }

      updateItem(id, { progress: 85, status: "saving" });
      await finalizePhoto({
        data: {
          fileSize: file.size,
          height: dims.height,
          mimeType: contentType as (typeof ACCEPTED_MIME)[number],
          originalKey: prep.originalKey,
          photoId: prep.photoId,
          thumbnailKey: prep.thumbnailKey,
          width: dims.width,
          ...exif,
        },
      });

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
        // eslint-disable-next-line no-await-in-loop
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

  const applyToAll = () => {
    setItems((prev) =>
      prev.map((it) =>
        it.status === "done" && it.photoId
          ? {
              ...it,
              alt: bulkAlt.trim() ? bulkAlt : it.alt,
              caption: bulkCaption.trim() ? bulkCaption : it.caption,
              saved: false,
            }
          : it,
      ),
    );
  };

  const saveAll = async () => {
    const targets = items.flatMap((it) =>
      it.status === "done" && it.photoId
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
          // eslint-disable-next-line no-console
          console.warn("rejected files", rejections);
        }}
        accept={IMAGE_MIME_TYPE}
        maxSize={50 * 1024 * 1024}
        loading={busy}
        multiple
      >
        <Group justify="center" mih={160} style={{ pointerEvents: "none" }}>
          <Stack align="center" gap={4}>
            <Text size="xl" fw={600}>
              画像をドラッグ&ドロップ
            </Text>
            <Text size="sm" c="dimmed">
              JPEG / PNG / WebP / AVIF / HEIC、1 ファイル 50 MB まで
            </Text>
          </Stack>
        </Group>
      </Dropzone>

      {editableCount > 0 && (
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              まとめて入力する
            </Text>
            <Textarea
              label="キャプション"
              value={bulkCaption}
              onChange={(e) => setBulkCaption(e.currentTarget.value)}
              autosize
              minRows={1}
              maxLength={2000}
            />
            <Textarea
              label="代替テキスト"
              value={bulkAlt}
              onChange={(e) => setBulkAlt(e.currentTarget.value)}
              autosize
              minRows={1}
              maxLength={500}
            />
            <Group justify="space-between" gap="sm">
              <Text size="xs" c="dimmed">
                入力した項目だけを全ての写真に反映します
              </Text>
              <Button
                variant="default"
                size="xs"
                onClick={applyToAll}
                disabled={savingAll || (!bulkCaption.trim() && !bulkAlt.trim())}
              >
                すべてに適用する
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {items.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <Table.ScrollContainer minWidth={720}>
            <Table verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={72} />
                  <Table.Th w={200}>ファイル</Table.Th>
                  <Table.Th>キャプション</Table.Th>
                  <Table.Th>代替テキスト</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((it) => {
                  const editable = it.status === "done" && Boolean(it.photoId);
                  return (
                    <Table.Tr key={it.id}>
                      <Table.Td>
                        {it.thumbUrl && (
                          <img
                            src={it.thumbUrl}
                            alt={it.name}
                            width={56}
                            height={56}
                            style={{ borderRadius: 6, objectFit: "cover" }}
                          />
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
                          <Text size="sm" truncate maw={180}>
                            {it.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {STATUS_LABEL[it.status]}
                          </Text>
                          {it.status !== "done" && (
                            <Progress
                              value={it.progress}
                              color={it.status === "error" ? "red" : undefined}
                            />
                          )}
                          {it.saved && (
                            <Text size="xs" c="teal">
                              保存しました
                            </Text>
                          )}
                          {it.error && (
                            <Text size="xs" c="red">
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
                          disabled={!editable}
                          autosize
                          minRows={1}
                          maxLength={2000}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Textarea
                          value={it.alt}
                          onChange={(e) =>
                            updateItem(it.id, { alt: e.currentTarget.value, saved: false })
                          }
                          disabled={!editable}
                          autosize
                          minRows={1}
                          maxLength={500}
                        />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      <Group justify="flex-end" gap="sm">
        <Button
          variant="default"
          onClick={() => setItems([])}
          disabled={busy || savingAll || items.length === 0}
        >
          履歴を消去する
        </Button>
        <Button
          onClick={() => {
            void saveAll();
          }}
          loading={savingAll}
          disabled={editableCount === 0}
        >
          {editableCount > 0 ? `${editableCount} 件をまとめて保存する` : "まとめて保存する"}
        </Button>
      </Group>
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
