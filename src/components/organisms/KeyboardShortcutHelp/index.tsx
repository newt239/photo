import { ActionIcon, Group, Kbd, Modal, Stack, Table, Text } from "@mantine/core";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { KeyboardIcon } from "lucide-react";

export const KeyboardShortcutHelp = () => {
  const [opened, { open, close }] = useDisclosure(false);
  useHotkeys([["shift+/", open]]);

  const sections = [
    {
      rows: [
        { keys: ["←", "→"], label: "前後の写真へ移動する" },
        { keys: ["Esc"], label: "一覧に戻る" },
      ],
      title: "写真の詳細",
    },
    {
      rows: [
        { keys: ["Shift"], label: "クリックで範囲を選択する" },
        { keys: ["⌘", "A"], label: "このページをすべて選択する" },
        { keys: ["Esc"], label: "選択を解除する" },
        { keys: ["Delete"], label: "選択した写真を削除する" },
      ],
      title: "写真の一覧",
    },
    {
      rows: [
        { keys: ["←", "→"], label: "前後の写真へ移動する" },
        { keys: ["Home", "End"], label: "先頭・末尾へ移動する" },
        { keys: ["+", "-"], label: "拡大・縮小する" },
        { keys: ["0"], label: "全体を表示する" },
        { keys: ["Esc"], label: "閉じる" },
      ],
      title: "拡大表示",
    },
  ];

  return (
    <>
      <ActionIcon variant="subtle" color="gray" aria-label="キーボード操作を見る" onClick={open}>
        <KeyboardIcon size={18} />
      </ActionIcon>

      <Modal opened={opened} onClose={close} title="キーボード操作" centered>
        <Stack gap="lg">
          {sections.map((section) => (
            <Stack key={section.title} gap="xs">
              <Text size="sm" fw={600}>
                {section.title}
              </Text>
              <Table verticalSpacing={4}>
                <Table.Tbody>
                  {section.rows.map((row) => (
                    <Table.Tr key={row.label}>
                      <Table.Td w={140}>
                        <Group gap={4}>
                          {row.keys.map((key) => (
                            <Kbd key={key}>{key}</Kbd>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{row.label}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          ))}
          <Text size="xs" c="dimmed">
            入力欄にカーソルがあるときはショートカットは動きません
          </Text>
        </Stack>
      </Modal>
    </>
  );
};
