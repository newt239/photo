import { ClerkProvider } from "@clerk/tanstack-react-start";

const AppClerkProvider = ({ children }: { children: React.ReactNode }) => (
  <ClerkProvider
    signInUrl="/login"
    signUpUrl="/register"
    afterSignOutUrl="/"
    signInFallbackRedirectUrl="/admin"
    signUpFallbackRedirectUrl="/admin"
  >
    {children}
  </ClerkProvider>
);

export default AppClerkProvider;
