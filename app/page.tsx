import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const instant = false;

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/editor");
  }

  redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in");
}
