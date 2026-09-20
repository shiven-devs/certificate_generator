export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  google_not_configured: "Google sign-in is not available yet.",
  google_unverified: "Your Google email must be verified before you can sign in.",
  google_rate_limited: "Too many Google sign-in attempts. Please try again later.",
  google_state_invalid:
    "Google sign-in expired or was interrupted. Please try Continue with Google again.",
  google_invalid_client:
    "Google rejected this app's secret. In Vercel, replace GOOGLE_CLIENT_SECRET with the current secret from Google Cloud, then Redeploy.",
  google_redirect_mismatch:
    "Google rejected the callback URL. In Google Cloud it must be exactly https://certitube.vercel.app/api/auth/google/callback",
  google_failed: "Google sign-in failed. Please try again.",
};

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <p
      className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
      role="alert"
    >
      {message}
    </p>
  );
}
