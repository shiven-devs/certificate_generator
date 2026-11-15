import { Marked } from "marked";

/**
 * Blog posts are written in Markdown by the blog author. Raw HTML is escaped
 * and links/images are limited to safe protocols, so even a compromised author
 * account cannot inject script into public pages.
 */

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/** Relative paths, in-page anchors, http(s) and mailto only. */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (href.startsWith("#") || (href.startsWith("/") && !href.startsWith("//"))) {
    return href;
  }
  return /^(https?:\/\/|mailto:)/i.test(href) ? href : null;
}

function safeImageSrc(raw: string): string | null {
  const src = raw.trim();
  return /^https:\/\//i.test(src) || (src.startsWith("/") && !src.startsWith("//"))
    ? src
    : null;
}

const marked = new Marked({
  gfm: true,
  async: false,
  renderer: {
    html(token) {
      return escapeHtml(token.text);
    },
    link(token) {
      const text = this.parser.parseInline(token.tokens);
      const href = safeHref(token.href);
      if (!href) {
        return text;
      }
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      const external = /^https?:\/\//i.test(href)
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      return `<a href="${escapeHtml(href)}"${title}${external}>${text}</a>`;
    },
    image(token) {
      const src = safeImageSrc(token.href);
      if (!src) {
        return escapeHtml(token.text);
      }
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(token.text)}"${title} loading="lazy" />`;
    },
  },
});

export function renderBlogMarkdown(markdown: string): string {
  return marked.parse(markdown) as string;
}

/** Estimated reading time at about 220 words per minute. */
export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
