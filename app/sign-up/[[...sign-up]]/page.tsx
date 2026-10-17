import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

import { AuthLayout } from "@/components/auth/auth-layout";

export const instant = false;

export default function SignUpPage() {
  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";

  return (
    <AuthLayout>
      <Suspense>
        <SignUp routing="path" path="/sign-up" signInUrl={signInUrl} />
      </Suspense>
    </AuthLayout>
  );
}
