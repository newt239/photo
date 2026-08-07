import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

type PhotoBulkActionsProps = {
  selectedCount: number;
  submitting: boolean;
  onSelectAll: () => void;
  onCancel: () => void;
  onDelete: () => Promise<void>;
  onRemoveFromAlbum?: () => Promise<void>;
};

export const PhotoBulkActions = ({
  selectedCount,
  submitting,
  onSelectAll,
  onCancel,
  onDelete,
  onRemoveFromAlbum,
}: PhotoBulkActionsProps) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Group gap="sm" wrap="wrap">
      <Text size="sm" c="dimmed">
        {selectedCount} 枚を選択中
      </Text>
      <Button variant="subtle" size="xs" onClick={onSelectAll} disabled={submitting}>
        すべて選択する
      </Button>
      {onRemoveFromAlbum && (
        <Button
          variant="default"
          size="xs"
          disabled={selectedCount === 0}
          loading={submitting}
          onClick={() => {
            void onRemoveFromAlbum();
          }}
        >
          アルバムから外す
        </Button>
      )}
      <Button color="red" size="xs" disabled={selectedCount === 0 || submitting} onClick={open}>
        削除する
      </Button>
      <Button variant="subtle" color="gray" size="xs" onClick={onCancel} disabled={submitting}>
        選択をやめる
      </Button>

      <Modal opened={opened} onClose={close} title="写真を削除する" centered>
        <Stack gap="md">
          <Text size="sm">
            選択した {selectedCount} 枚の写真を削除します。この操作は取り消せません。
          </Text>
          <Text size="sm" c="dimmed">
            写真が含まれているすべてのアルバムからも取り除かれます。
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={close} disabled={submitting}>
              キャンセルする
            </Button>
            <Button
              color="red"
              loading={submitting}
              onClick={() => {
                void onDelete().then(close);
              }}
            >
              削除する
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Group>
  );
};
