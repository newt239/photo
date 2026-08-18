import { Badge, Button, Group, Title } from "@mantine/core";
import { ChevronDownIcon, ChevronUpIcon, FilterIcon } from "lucide-react";

type FilterHeaderProps = {
  title: string;
  appliedCount: number;
  opened: boolean;
  onToggle: () => void;
};

export const FilterHeader = ({ title, appliedCount, opened, onToggle }: FilterHeaderProps) => (
  <Group justify="space-between" align="center" wrap="wrap" gap="sm">
    <Title order={2}>{title}</Title>
    <Group gap="sm">
      {appliedCount > 0 && <Badge variant="light">{`${appliedCount} 件の条件`}</Badge>}
      <Button
        variant="default"
        leftSection={<FilterIcon size={16} />}
        rightSection={opened ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
        onClick={onToggle}
      >
        絞り込む
      </Button>
    </Group>
  </Group>
);
