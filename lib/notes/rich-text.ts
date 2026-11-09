/**
 * Limited Notion-flavored markdown <-> HTML for lesson notes.
 * Supports bold, italic, underline, and headings 1–4.
 */

const UNDERLINE_OPEN = '<span underline="true">';
const UNDERLINE_CLOSE = "</span>";

export type NotesFormat =
  | "bold"
  | "italic"
  | "underline"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4";

export function wrapInlineMarkdown(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  format: "bold" | "italic" | "underline",
): { next: string; cursorStart: number; cursorEnd: number } {
  const selected = text.slice(selectionStart, selectionEnd) || "text";
  const before = text.slice(0, selectionStart);
  const after = text.slice(selectionEnd);

  let wrapped: string;
  if (format === "bold") {
    wrapped = `**${selected}**`;
  } else if (format === "italic") {
    wrapped = `*${selected}*`;
  } else {
    wrapped = `${UNDERLINE_OPEN}${selected}${UNDERLINE_CLOSE}`;
  }

  const next = `${before}${wrapped}${after}`;
  const cursorStart = before.length;
  return { next, cursorStart, cursorEnd: cursorStart + wrapped.length };
}

export function applyHeadingMarkdown(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  level: 1 | 2 | 3 | 4,
): { next: string; cursorStart: number; cursorEnd: number } {
  const lineStart = text.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const lineEndIndex = text.indexOf("\n", selectionEnd);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  const line = text.slice(lineStart, lineEnd);
  const stripped = line.replace(/^#{1,6}\s+/, "");
  const prefix = `${"#".repeat(level)} `;
  const nextLine = `${prefix}${stripped || "Heading"}`;
  const next = `${text.slice(0, lineStart)}${nextLine}${text.slice(lineEnd)}`;
  return {
    next,
    cursorStart: lineStart + prefix.length,
    cursorEnd: lineStart + nextLine.length,
  };
}

/** Convert stored markdown to safe HTML for the visual editor. */
export function markdownToEditorHtml(markdown: string): string {
  if (!markdown) {
    return "";
  }

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const htmlParts: string[] = [];

  for (const line of lines) {
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      htmlParts.push(`<h${level}>${inlineMarkdownToHtml(heading[2])}</h${level}>`);
      continue;
    }
    if (line.trim() === "") {
      htmlParts.push("<div><br></div>");
      continue;
    }
    htmlParts.push(`<div>${inlineMarkdownToHtml(line)}</div>`);
  }

  return htmlParts.join("");
}

/** Serialize the visual editor HTML back to Notion-flavored markdown. */
export function editorHtmlToMarkdown(html: string): string {
  if (typeof document === "undefined") {
    return stripTagsFallback(html);
  }

  const root = document.createElement("div");
  root.innerHTML = html;

  const lines: string[] = [];
  const blocks = Array.from(root.childNodes);

  if (blocks.length === 0) {
    return "";
  }

  for (const node of blocks) {
    lines.push(serializeBlock(node));
  }

  // Collapse trailing empty lines that contentEditable often appends.
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

function serializeBlock(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return serializeInline(node);
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (/^h[1-4]$/.test(tag)) {
    const level = Number(tag[1]);
    const inner = serializeInlineChildren(el).trim();
    return `${"#".repeat(level)} ${inner || "Heading"}`;
  }

  if (tag === "br") {
    return "";
  }

  if (tag === "div" || tag === "p") {
    if (el.childNodes.length === 1 && el.firstChild?.nodeName === "BR") {
      return "";
    }
    return serializeInlineChildren(el);
  }

  if (tag === "ul" || tag === "ol") {
    return Array.from(el.children)
      .map((child) => serializeBlock(child))
      .join("\n");
  }

  if (tag === "li") {
    return `- ${serializeInlineChildren(el)}`;
  }

  return serializeInlineChildren(el);
}

function serializeInlineChildren(el: HTMLElement): string {
  return Array.from(el.childNodes).map((child) => serializeInline(child)).join("");
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeMarkdownInline(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const inner = serializeInlineChildren(el);

  if (tag === "br") {
    return "\n";
  }
  if (tag === "strong" || tag === "b") {
    return `**${inner}**`;
  }
  if (tag === "em" || tag === "i") {
    return `*${inner}*`;
  }
  if (tag === "u") {
    return `${UNDERLINE_OPEN}${inner}${UNDERLINE_CLOSE}`;
  }
  if (tag === "span" && el.getAttribute("underline") === "true") {
    return `${UNDERLINE_OPEN}${inner}${UNDERLINE_CLOSE}`;
  }
  if (tag === "s" || tag === "strike" || tag === "del") {
    return `~~${inner}~~`;
  }
  if (tag === "code") {
    return `\`${inner}\``;
  }
  return inner;
}

function inlineMarkdownToHtml(text: string): string {
  // Backslash-escaped characters are literal text, so they are lifted out
  // before the marker passes run: a `\*` must not open emphasis, and they must
  // come back without their backslash or every save/reload cycle would add one.
  const literals: string[] = [];
  const withPlaceholders = text
    .replace(/\u0000/g, "")
    .replace(/\\([\s\S])/g, (_match, character: string) => {
      literals.push(character);
      return `\u0000${literals.length - 1}\u0000`;
    });

  let result = escapeHtml(withPlaceholders);

  // Underline spans (Notion-flavored) — process before other tags get escaped wrongly.
  // Input was escaped, so restore/replace from escaped form of our markers.
  result = result.replace(
    /&lt;span underline=&quot;true&quot;&gt;([\s\S]*?)&lt;\/span&gt;/gi,
    "<u>$1</u>",
  );
  result = result.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, "<u>$1</u>");

  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  result = result.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

  result = result.replace(/\u0000(\d+)\u0000/g, (_match, index: string) =>
    escapeHtml(literals[Number(index)] ?? ""),
  );

  return result || "<br>";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Escapes only what would otherwise be read back as formatting, here or in
 * Notion. Braces and carets carry no markdown meaning, and escaping them turned
 * pasted code into a thicket of backslashes.
 */
function escapeMarkdownInline(value: string): string {
  return value.replace(/([\\*_~`[\]<>|])/g, "\\$1");
}

function stripTagsFallback(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|h[1-4])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

export function sanitizeEditorPasteHtml(html: string): string {
  if (typeof document === "undefined") {
    return escapeHtml(html);
  }
  const root = document.createElement("div");
  root.innerHTML = html;
  stripDisallowed(root);
  return root.innerHTML;
}

function stripDisallowed(node: Node): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const allowed = new Set([
        "div",
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "span",
        "h1",
        "h2",
        "h3",
        "h4",
        "code",
      ]);
      if (!allowed.has(tag)) {
        const text = document.createTextNode(el.textContent ?? "");
        node.replaceChild(text, el);
        continue;
      }
      // Drop all attributes except underline on span.
      for (const attr of Array.from(el.attributes)) {
        if (!(tag === "span" && attr.name === "underline" && attr.value === "true")) {
          el.removeAttribute(attr.name);
        }
      }
      stripDisallowed(el);
    }
  }
}
