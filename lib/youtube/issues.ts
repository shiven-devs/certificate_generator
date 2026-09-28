import type { ItemIssueReason } from "@/lib/youtube/types";

export function itemIssueLabel(reason: ItemIssueReason): string {
  switch (reason) {
    case "not_embeddable":
      return "Cannot be embedded";
    case "unavailable":
      return "Unavailable or private";
    case "live":
      return "Live streams cannot be certified";
    case "no_duration":
      return "Missing duration";
    case "not_learning":
      return "Not a learning video";
  }
}
