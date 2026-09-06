"use client";

import { useRouter } from "next/navigation";
import { SESSION_KICK_LOGIN_PATH } from "@/lib/auth/constants";
import { isSessionInvalidated, type ClientApiError } from "@/lib/api/client";

export function useSessionErrorRedirect() {
  const router = useRouter();

  return (error: ClientApiError) => {
    if (!isSessionInvalidated(error)) {
      return false;
    }
    router.replace(SESSION_KICK_LOGIN_PATH);
    router.refresh();
    return true;
  };
}
