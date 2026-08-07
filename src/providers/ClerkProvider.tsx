import { ClerkProvider as ClerkProviderBase } from "@clerk/tanstack-react-start";

export const ClerkProvider = ({ children }: { children: React.ReactNode }) => (
  <ClerkProviderBase
    signInUrl="/login"
    signUpUrl="/register"
    afterSignOutUrl="/"
    signInFallbackRedirectUrl="/admin"
    signUpFallbackRedirectUrl="/admin"
  >
    {children}
  </ClerkProviderBase>
);
