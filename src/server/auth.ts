import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'

export const fetchAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId, sessionId } = await auth()
  return { userId, sessionId }
})
