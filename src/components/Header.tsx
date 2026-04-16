import { Group } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import ClerkHeader from "../integrations/clerk/header-user.tsx";
import classes from "./Header.module.css";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Link to="/" className={classes.brand}>
          TanStack Start
        </Link>

        <Group gap="md" className={classes.nav}>
          <Link to="/" className={classes.link} activeProps={{ "data-status": "active" }}>
            Home
          </Link>
          <Link to="/photos" className={classes.link} activeProps={{ "data-status": "active" }}>
            Photos
          </Link>
          <Link to="/albums" className={classes.link} activeProps={{ "data-status": "active" }}>
            Albums
          </Link>
          <Link to="/dashboard" className={classes.link} activeProps={{ "data-status": "active" }}>
            Dashboard
          </Link>
          <ClerkHeader />
          <ThemeToggle />
        </Group>
      </div>
    </header>
  );
}
