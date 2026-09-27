const TITLE_MAX = 180;

export function singleLineTitle(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, TITLE_MAX) || "Lesson notes";
}

export function buildNotionNoteMarkdown(input: {
  courseTitle: string;
  lessonTitle: string;
  body: string;
}): string {
  const lesson = singleLineTitle(input.lessonTitle);
  const course = singleLineTitle(input.courseTitle);
  const body = input.body.trim();

  const sections = [`# ${lesson}`, `Course: ${course}`, ""];
  sections.push(body || "_No notes yet._");
  sections.push("", "---", "Synced from Certitube");
  return sections.join("\n");
}
