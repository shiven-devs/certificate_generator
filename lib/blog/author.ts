/**
 * Accounts allowed to write on the blog, from BLOG_AUTHOR_EMAILS
 * (comma-separated). Unset means nobody can write: the blog fails closed.
 */
export function blogAuthorEmails(raw = process.env.BLOG_AUTHOR_EMAILS): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Password signups never verify the address, so an email match alone could be
 * claimed by whoever registers it first. Writing also needs a linked Google
 * identity, which only exists after Google confirmed the email.
 */
export function canWriteBlog(
  account: { email: string; hasGoogleIdentity: boolean },
  allowed = blogAuthorEmails(),
): boolean {
  return account.hasGoogleIdentity && allowed.has(account.email.trim().toLowerCase());
}
