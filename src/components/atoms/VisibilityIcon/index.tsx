import { GlobeIcon, LockIcon } from "lucide-react";

type VisibilityIconProps = {
  visibility: "public" | "private";
  size: number;
};

export const VisibilityIcon = ({ visibility, size }: VisibilityIconProps) =>
  visibility === "public" ? (
    <GlobeIcon size={size} role="img" aria-label="公開" color="var(--mantine-color-dimmed)" />
  ) : (
    <LockIcon size={size} role="img" aria-label="非公開" color="var(--mantine-color-dimmed)" />
  );
