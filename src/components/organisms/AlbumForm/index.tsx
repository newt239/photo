import { useState, type ReactNode } from "react";

import { Button, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";

import { VisibilityControl } from "#/components/molecules/VisibilityControl";

export type AlbumFormValues = {
  title: string;
  slug: string;
  description: string;
  visibility: "public" | "private";
};

type AlbumFormProps = {
  initialValues?: AlbumFormValues;
  slugRequired?: boolean;
  slugDescription: string;
  requireDirty?: boolean;
  submitLabel: string;
  submitIcon: ReactNode;
  submitting: boolean;
  errorMessage: string | null;
  statusMessage?: string;
  onSubmit: (values: AlbumFormValues) => void;
};

export const AlbumForm = ({
  initialValues = { description: "", slug: "", title: "", visibility: "private" },
  slugRequired = false,
  slugDescription,
  requireDirty = false,
  submitLabel,
  submitIcon,
  submitting,
  errorMessage,
  statusMessage,
  onSubmit,
}: AlbumFormProps) => {
  const [title, setTitle] = useState(initialValues.title);
  const [slug, setSlug] = useState(initialValues.slug);
  const [description, setDescription] = useState(initialValues.description);
  const [visibility, setVisibility] = useState(initialValues.visibility);
  const dirty =
    title.trim() !== initialValues.title ||
    slug.trim() !== initialValues.slug ||
    description.trim() !== initialValues.description ||
    visibility !== initialValues.visibility;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          description: description.trim(),
          slug: slug.trim(),
          title: title.trim(),
          visibility,
        });
      }}
    >
      <Stack gap="md">
        <TextInput
          label="名前"
          required
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          maxLength={200}
        />
        <Textarea
          label="説明"
          autosize
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          maxLength={2000}
        />
        <TextInput
          label="URL"
          description={slugDescription}
          required={slugRequired}
          value={slug}
          onChange={(e) => setSlug(e.currentTarget.value)}
          maxLength={200}
        />
        <VisibilityControl value={visibility} onChange={setVisibility} />
        {errorMessage && (
          <Text size="sm" c="red">
            {errorMessage}
          </Text>
        )}
        <Group justify="flex-end" gap="sm">
          {statusMessage && (
            <Text size="sm" c="dimmed">
              {statusMessage}
            </Text>
          )}
          <Button
            type="submit"
            leftSection={submitIcon}
            loading={submitting}
            disabled={
              title.trim().length === 0 ||
              (slugRequired && slug.trim().length === 0) ||
              (requireDirty && !dirty)
            }
          >
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
