import {
  Button,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core'

export default function ThemeToggle() {
  const { setColorScheme, colorScheme } = useMantineColorScheme()
  const computed = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  })

  function toggleMode() {
    const next =
      colorScheme === 'light'
        ? 'dark'
        : colorScheme === 'dark'
          ? 'auto'
          : 'light'
    setColorScheme(next)
  }

  const label =
    colorScheme === 'auto'
      ? `Theme: auto (${computed}). Click to switch.`
      : `Theme: ${colorScheme}. Click to switch.`

  return (
    <Button
      variant="default"
      size="xs"
      onClick={toggleMode}
      aria-label={label}
      title={label}
    >
      {colorScheme === 'auto' ? 'Auto' : colorScheme === 'dark' ? 'Dark' : 'Light'}
    </Button>
  )
}
