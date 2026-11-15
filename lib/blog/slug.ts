export const BLOG_SLUG_MAX = 100;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Slugs that would collide with routes under /blog. */
const RESERVED = new Set(["new"]);

export function isValidBlogSlug(value: string): boolean {
  return value.length <= BLOG_SLUG_MAX && SLUG.test(value) && !RESERVED.has(value);
}

export function slugifyTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, BLOG_SLUG_MAX)
    .replace(/-+$/g, "");
  return RESERVED.has(slug) ? `${slug}-post` : slug;
}
