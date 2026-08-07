import { useClerk } from "@clerk/tanstack-react-start";
import { Button } from "@mantine/core";
import { LogOutIcon } from "lucide-react";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };
  return (
    <Button
      color="red"
      variant="light"
      leftSection={<LogOutIcon size={16} />}
      onClick={handleSignOut}
    >
      ログアウト
    </Button>
  );
};
