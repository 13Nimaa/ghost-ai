import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up";

const isPublicRoute = createRouteMatcher([
  `${signInUrl}(.*)`,
  `${signUpUrl}(.*)`,
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // API routes enforce auth inside their handlers and return JSON 401s,
  // so the middleware must not redirect them to the sign-in page.
  if (isApiRoute(request)) {
    return;
  }
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
