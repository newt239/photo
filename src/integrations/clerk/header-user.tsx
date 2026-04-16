import {
  SignedIn,
  SignInButton,
  SignedOut,
  UserButton,
} from '@clerk/react'

export default function HeaderUser() {
  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </>
  )
}
