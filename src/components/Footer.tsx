import { Text } from "@mantine/core";

import classes from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={classes.footer}>
      <div className={classes.inner}>
        <Text size="sm">&copy; {year} Your name here. All rights reserved.</Text>
        <Text size="sm" fw={600}>
          Built with TanStack Start
        </Text>
      </div>
    </footer>
  );
}
