import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/tanstack-react-start'
import { Center } from '@mantine/core'

export const Route = createFileRoute('/register/$')({ component: RegisterPage })

function RegisterPage() {
  return (
    <Center mih="80vh" p="lg">
      <SignUp routing="path" path="/register" signInUrl="/login" />
    </Center>
  )
}
