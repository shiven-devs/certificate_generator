const TITLE_MAX = 180;

export function singleLineTitle(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, TITLE_MAX) || "Lesson notes";
}

export function buildNotionNoteMarkdown(input: {
  courseTitle: string;
  lessonTitle: string;
  body: string;
  /**
   * Set for every note page after the first, so each one lands in its own
   * Notion page with a distinguishable title. The first page keeps the plain
   * lesson title it has always had.
   */
  pageTitle?: string | null;
}): string {
  const lesson = singleLineTitle(input.lessonTitle);
  const course = singleLineTitle(input.courseTitle);
  const body = input.body.trim();
  const pageTitle = input.pageTitle ? singleLineTitle(input.pageTitle) : null;
  const heading = pageTitle ? `${lesson} — ${pageTitle}` : lesson;

  const sections = [`# ${heading}`, `Course: ${course}`, ""];
  sections.push(body || "_No notes yet._");
  sections.push("", "---", "Synced from Certitube");
  return sections.join("\n");
}
