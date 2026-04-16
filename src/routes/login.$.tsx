import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/tanstack-react-start'
import { Center } from '@mantine/core'

export const Route = createFileRoute('/login/$')({ component: LoginPage })

function LoginPage() {
  return (
    <Center mih="80vh" p="lg">
      <SignIn routing="path" path="/login" signUpUrl="/register" />
    </Center>
  )
}
