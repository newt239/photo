import {
  ActionIcon,
  Anchor,
  Progress,
  Stack,
  Table,
  Text,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react";

export type UploadDraftItem = {
  id: string;
  name: string;
  status: "queued" | "preparing" | "uploading" | "saving" | "done" | "duplicate" | "error";
  progress: number;
  error?: string;
  photoId?: string;
  duplicatePhotoId?: string;
  thumbUrl?: string;
  caption: string;
  alt: string;
  saved?: boolean;
  generating?: "caption" | "alt";
};

type UploadDraftRowProps = {
  item: UploadDraftItem;
  generatingField: "caption" | "alt" | null;
  onPreview: () => void;
  onChange: (patch: Partial<UploadDraftItem>) => void;
  onGenerate: (field: "caption" | "alt") => void;
};

export const UploadDraftRow = ({
  item,
  generatingField,
  onPreview,
  onChange,
  onGenerate,
}: UploadDraftRowProps) => {
  const { duplicatePhotoId } = item;
  const editable = item.status === "done" && Boolean(item.photoId);
  const statusLabel: Record<UploadDraftItem["status"], string> = {
    done: "完了",
    duplicate: "重複",
    error: "エラー",
    preparing: "前処理中",
    queued: "待機中",
    saving: "保存中",
    uploading: "アップロード中",
  };

  return (
    <Table.Tr>
      <Table.Td>
        {item.thumbUrl && (
          <UnstyledButton
            onClick={onPreview}
            aria-label={`${item.name} を大きく表示する`}
            style={{ cursor: "zoom-in", display: "block" }}
          >
            <img
              src={item.thumbUrl}
              alt={item.name}
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
            {item.name}
          </Text>
          <Text size="xs" c="dimmed" role="status">
            {statusLabel[item.status]}
          </Text>
          {item.status !== "done" && item.status !== "duplicate" && (
            <Progress value={item.progress} color={item.status === "error" ? "red" : undefined} />
          )}
          {duplicatePhotoId !== undefined && (
            <Anchor
              renderRoot={(props) => (
                <Link
                  {...props}
                  to="/admin/photos/$photoId"
                  params={{ photoId: duplicatePhotoId }}
                />
              )}
              size="xs"
            >
              同じ写真が既にあります
            </Anchor>
          )}
          {item.generating && (
            <Text size="xs" c="blue">
              AIで生成中
            </Text>
          )}
          {item.saved && !item.generating && (
            <Text size="xs" c="teal">
              保存しました
            </Text>
          )}
          {item.error && (
            <Text size="xs" c="red" role="alert">
              {item.error}
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Textarea
          value={item.caption}
          onChange={(e) => onChange({ caption: e.currentTarget.value, saved: false })}
          disabled={!editable || item.generating === "caption"}
          autosize
          minRows={1}
          maxLength={2000}
          rightSection={
            <ActionIcon
              variant="subtle"
              size="sm"
              aria-label="キャプションをAIで生成する"
              onClick={() => onGenerate("caption")}
              loading={item.generating === "caption"}
              disabled={!editable || generatingField !== null || item.generating === "alt"}
            >
              <SparklesIcon size={14} />
            </ActionIcon>
          }
          rightSectionPointerEvents="all"
          rightSectionProps={{ style: { alignItems: "flex-start", paddingTop: 4 } }}
        />
      </Table.Td>
      <Table.Td>
        <Textarea
          value={item.alt}
          onChange={(e) => onChange({ alt: e.currentTarget.value, saved: false })}
          disabled={!editable || item.generating === "alt"}
          autosize
          minRows={1}
          maxLength={500}
          rightSection={
            <ActionIcon
              variant="subtle"
              size="sm"
              aria-label="代替テキストをAIで生成する"
              onClick={() => onGenerate("alt")}
              loading={item.generating === "alt"}
              disabled={!editable || generatingField !== null || item.generating === "caption"}
            >
              <SparklesIcon size={14} />
            </ActionIcon>
          }
          rightSectionPointerEvents="all"
          rightSectionProps={{ style: { alignItems: "flex-start", paddingTop: 4 } }}
        />
      </Table.Td>
    </Table.Tr>
  );
};
