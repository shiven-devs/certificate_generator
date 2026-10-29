/**
 * Certificate issuing is switched off while the product has no YouTube API
 * quota headroom for it. The certificate code is kept intact behind this flag
 * so turning it back on is a config change, not a rewrite.
 */
export function certificatesEnabled(): boolean {
  return process.env.CERTIFICATES_ENABLED === "true";
}
