const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPostDate(date: Date | string | null): string | null {
  return date ? dateFormat.format(new Date(date)) : null;
}
