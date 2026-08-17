import { useState } from "react";

import {
  ActionIcon,
  Button,
  Group,
  Menu,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  CheckCheckIcon,
  EllipsisIcon,
  FolderInputIcon,
  FolderMinusIcon,
  FolderPlusIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

type PhotoBulkActionsProps = {
  selectedCount: number;
  submitting: boolean;
  albums: { id: string; title: string }[];
  modal: "add" | "create" | "delete" | null;
  onModalChange: (next: "add" | "create" | "delete" | null) => void;
  onSelectAll: () => void;
  onCancel: () => void;
  onDelete: () => Promise<void>;
  onAddToAlbum: (albumId: string) => Promise<void>;
  onCreateAlbum: (title: string) => Promise<void>;
  onRemoveFromAlbum?: () => Promise<void>;
};

export const PhotoBulkActions = ({
  selectedCount,
  submitting,
  albums,
  modal,
  onModalChange,
  onSelectAll,
  onCancel,
  onDelete,
  onAddToAlbum,
  onCreateAlbum,
  onRemoveFromAlbum,
}: PhotoBulkActionsProps) => {
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  return (
    <Group gap="sm" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {selectedCount} 枚を選択中
      </Text>
      <Menu position="bottom-end" shadow="md" width={240}>
        <Menu.Target>
          <ActionIcon variant="default" disabled={submitting} aria-label="選択した写真の操作">
            <EllipsisIcon size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>選択</Menu.Label>
          <Menu.Item leftSection={<CheckCheckIcon size={14} />} onClick={onSelectAll}>
            このページをすべて選択する
          </Menu.Item>
          <Menu.Item leftSection={<XIcon size={14} />} onClick={onCancel}>
            選択を解除する
          </Menu.Item>
          <Menu.Divider />
          <Menu.Label>アルバム</Menu.Label>
          <Menu.Item
            leftSection={<FolderPlusIcon size={14} />}
            onClick={() => {
              setAlbumId(null);
              onModalChange("add");
            }}
            disabled={albums.length === 0}
          >
            既存のアルバムに追加する
          </Menu.Item>
          <Menu.Item
            leftSection={<PlusIcon size={14} />}
            onClick={() => {
              setTitle("");
              onModalChange("create");
            }}
          >
            新しいアルバムを作成する
          </Menu.Item>
          {onRemoveFromAlbum && (
            <Menu.Item
              leftSection={<FolderMinusIcon size={14} />}
              onClick={() => {
                onRemoveFromAlbum();
              }}
            >
              このアルバムから外す
            </Menu.Item>
          )}
          <Menu.Divider />
          <Menu.Item
            color="red"
            leftSection={<Trash2Icon size={14} />}
            onClick={() => onModalChange("delete")}
          >
            削除する
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal
        opened={modal === "add"}
        onClose={() => onModalChange(null)}
        title="既存のアルバムに追加する"
        centered
      >
        <Stack gap="md">
          <Select
            label="アルバム"
            placeholder="アルバムを選ぶ"
            value={albumId}
            onChange={setAlbumId}
            data={albums.map((album) => ({
              label: album.title,
              value: album.id,
            }))}
            searchable
            nothingFoundMessage="アルバムが見つかりません"
          />
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              leftSection={<XIcon size={16} />}
              onClick={() => onModalChange(null)}
              disabled={submitting}
            >
              キャンセルする
            </Button>
            <Button
              leftSection={<FolderInputIcon size={16} />}
              loading={submitting}
              disabled={!albumId}
              onClick={() => {
                if (albumId) {
                  onAddToAlbum(albumId).then(() => onModalChange(null));
                }
              }}
            >
              {selectedCount} 枚を追加する
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={modal === "create"}
        onClose={() => onModalChange(null)}
        title="新しいアルバムを作成する"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="名前"
            placeholder="アルバムの名前"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            maxLength={200}
          />
          <Text size="xs" c="dimmed">
            作成したアルバムは非公開です。公開状態はアルバムの設定から変更できます。
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              leftSection={<XIcon size={16} />}
              onClick={() => onModalChange(null)}
              disabled={submitting}
            >
              キャンセルする
            </Button>
            <Button
              leftSection={<PlusIcon size={16} />}
              loading={submitting}
              disabled={!title.trim()}
              onClick={() => {
                onCreateAlbum(title.trim()).then(() => onModalChange(null));
              }}
            >
              作成して {selectedCount} 枚を追加する
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={modal === "delete"}
        onClose={() => onModalChange(null)}
        title="写真を削除する"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            選択した {selectedCount} 枚の写真を削除します。この操作は取り消せません。
          </Text>
          <Text size="sm" c="dimmed">
            写真が含まれているすべてのアルバムからも取り除かれます。
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              leftSection={<XIcon size={16} />}
              onClick={() => onModalChange(null)}
              disabled={submitting}
            >
              キャンセルする
            </Button>
            <Button
              color="red"
              leftSection={<Trash2Icon size={16} />}
              loading={submitting}
              onClick={() => {
                onDelete().then(() => onModalChange(null));
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
