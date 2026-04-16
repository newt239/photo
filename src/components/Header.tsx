import { Link } from '@tanstack/react-router'
import { Group } from '@mantine/core'
import ClerkHeader from '../integrations/clerk/header-user.tsx'
import ThemeToggle from './ThemeToggle'
import classes from './Header.module.css'

export default function Header() {
  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Link to="/" className={classes.brand}>
          TanStack Start
        </Link>

        <Group gap="md" className={classes.nav}>
          <Link
            to="/"
            className={classes.link}
            activeProps={{ 'data-status': 'active' }}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={classes.link}
            activeProps={{ 'data-status': 'active' }}
          >
            About
          </Link>
          <a
            href="https://tanstack.com/start/latest/docs/framework/react/overview"
            className={classes.link}
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
          <ClerkHeader />
          <ThemeToggle />
        </Group>
      </div>
    </header>
  )
}
