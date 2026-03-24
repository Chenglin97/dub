import { UserProps } from "@/lib/types";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function getUserViaToken(req: NextRequest) {
  // Local dev bypass: skip JWT auth
  if (process.env.NODE_ENV === "development") {
    return {
      id: "user_demo_001",
      name: "Demo User",
      email: "demo@local.dev",
    } as UserProps;
  }

  const session = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as {
    email?: string;
    user?: UserProps;
  };

  return session?.user;
}
