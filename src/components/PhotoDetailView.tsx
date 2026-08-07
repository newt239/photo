import { useState, type ReactNode } from "react";

import {
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { useRouter } from "@tanstack/react-router";

import { generatePhotoDraft, updatePhoto } from "#/server/photos.ts";

import classes from "./PhotoDetailView.module.css";

type PhotoDetailData = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize: number;
  visibility: "public" | "private";
  takenAt: Date | string | null;
  uploadedAt: Date | string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  focalLength: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  iso: number | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
};

type InfoRow = { label: string; value: string };

const formatDateTime = (value: Date | string | null): string | null => {
  if (!value) {
    return null;
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleString("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const renderInfoList = (rows: InfoRow[]) => (
  <Stack gap={6}>
    {rows.map((row) => (
      <Group key={row.label} justify="space-between" gap="md" wrap="nowrap">
        <Text size="sm" c="dimmed">
          {row.label}
        </Text>
        <Text size="sm" ta="right">
          {row.value}
        </Text>
      </Group>
    ))}
  </Stack>
);

type Props = {
  photo: PhotoDetailData;
  backLink?: ReactNode;
};

export const PhotoDetailView = ({ photo, backLink }: Props) => {
  const router = useRouter();
  const imageSrc = `/api/i/${photo.storageKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`;
  const camera = [photo.cameraMake, photo.cameraModel].filter(Boolean).join(" ");
  const exifRows: InfoRow[] = [];
  if (camera) {
    exifRows.push({ label: "カメラ", value: camera });
  }
  if (photo.lensModel) {
    exifRows.push({ label: "レンズ", value: photo.lensModel });
  }
  if (photo.focalLength !== null) {
    exifRows.push({ label: "焦点距離", value: `${photo.focalLength} mm` });
  }
  if (photo.aperture !== null) {
    exifRows.push({ label: "絞り", value: `f/${photo.aperture}` });
  }
  if (photo.shutterSpeed) {
    exifRows.push({ label: "シャッター速度", value: `${photo.shutterSpeed} s` });
  }
  if (photo.iso !== null) {
    exifRows.push({ label: "ISO", value: `ISO ${photo.iso}` });
  }

  const fileSize =
    photo.fileSize < 1024
      ? `${photo.fileSize} B`
      : photo.fileSize < 1024 * 1024
        ? `${(photo.fileSize / 1024).toFixed(1)} KB`
        : `${(photo.fileSize / (1024 * 1024)).toFixed(2)} MB`;
  const fileRows: InfoRow[] = [
    { label: "サイズ", value: `${photo.width} × ${photo.height}` },
    { label: "ファイルサイズ", value: fileSize },
    { label: "形式", value: photo.mimeType },
  ];
  const uploaded = formatDateTime(photo.uploadedAt);
  if (uploaded) {
    fileRows.push({ label: "アップロード日時", value: uploaded });
  }
  const takenAt = formatDateTime(photo.takenAt);
  const hasLocation = photo.latitude !== null && photo.longitude !== null;

  const [caption, setCaption] = useState(photo.caption ?? "");
  const [alt, setAlt] = useState(photo.alt ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (generating) {
      return;
    }
    setGenerating(true);
    setErrorMessage(null);
    try {
      const result = await generatePhotoDraft({ data: { id: photo.id } });
      if (result.success) {
        setCaption(result.caption);
        setAlt(result.alt);
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await updatePhoto({
        data: {
          alt: alt.trim() || null,
          caption: caption.trim() || null,
          id: photo.id,
        },
      });
      if (result.success) {
        await router.invalidate();
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack p="xl" gap="md">
      {backLink && <Group wrap="nowrap">{backLink}</Group>}

      <Stack gap="md">
        <Group justify="flex-end">
          <Badge variant="light">{photo.visibility === "public" ? "公開" : "非公開"}</Badge>
        </Group>
        <Textarea
          label="キャプション"
          autosize
          minRows={2}
          value={caption}
          onChange={(e) => setCaption(e.currentTarget.value)}
          maxLength={2000}
        />
        <Textarea
          label="代替テキスト"
          autosize
          minRows={2}
          value={alt}
          onChange={(e) => setAlt(e.currentTarget.value)}
          maxLength={500}
        />
        {errorMessage && (
          <Text size="sm" c="red">
            {errorMessage}
          </Text>
        )}
        <Group justify="space-between">
          <Button
            variant="light"
            loading={generating}
            disabled={submitting}
            onClick={handleGenerate}
          >
            AIで生成する
          </Button>
          <Button loading={submitting} disabled={generating} onClick={handleSubmit}>
            保存する
          </Button>
        </Group>
        {takenAt && (
          <Text size="sm" c="dimmed">
            撮影日時: {takenAt}
          </Text>
        )}
      </Stack>

      <div className={classes.frame} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <img src={imageSrc} alt={alt || caption || ""} />
      </div>

      <SimpleGrid cols={{ base: 1, md: hasLocation ? 3 : 2 }} spacing="md">
        {exifRows.length > 0 && (
          <Card withBorder radius="md" padding="md">
            <Stack gap="xs">
              <Title order={4}>EXIF</Title>
              {renderInfoList(exifRows)}
            </Stack>
          </Card>
        )}
        <Card withBorder radius="md" padding="md">
          <Stack gap="xs">
            <Title order={4}>ファイル情報</Title>
            {renderInfoList(fileRows)}
          </Stack>
        </Card>
        {photo.latitude !== null && photo.longitude !== null && (
          <Card withBorder radius="md" padding="md">
            <Stack gap="xs">
              <Title order={4}>位置情報</Title>
              {renderInfoList([
                { label: "緯度", value: photo.latitude.toFixed(6) },
                { label: "経度", value: photo.longitude.toFixed(6) },
                ...(photo.altitude === null
                  ? []
                  : [{ label: "標高", value: `${photo.altitude.toFixed(1)} m` }]),
              ])}
              <Anchor
                href={`https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
              >
                Google Maps で開く
              </Anchor>
            </Stack>
          </Card>
        )}
      </SimpleGrid>
    </Stack>
  );
};
