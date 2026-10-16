import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

import { AuthLayout } from "@/components/auth/auth-layout";

export const instant = false;

export default function SignInPage() {
  const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up";

  return (
    <AuthLayout>
      <Suspense>
        <SignIn routing="path" path="/sign-in" signUpUrl={signUpUrl} />
      </Suspense>
    </AuthLayout>
  );
}
