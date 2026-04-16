import {
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/tanstack-react-start'

export default function HeaderUser() {
  const { isLoaded, isSignedIn } = useUser()
  if (!isLoaded) return null
  return isSignedIn ? <UserButton /> : <SignInButton />
}
