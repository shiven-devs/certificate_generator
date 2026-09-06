import { redirect } from "next/navigation";
import { SESSION_KICK_LOGIN_PATH } from "@/lib/auth/constants";
import type { SessionState } from "@/lib/auth/session";

export function redirectIfSessionInvalidated(session: SessionState): void {
  if (session.status === "invalidated") {
    redirect(SESSION_KICK_LOGIN_PATH);
  }
}
