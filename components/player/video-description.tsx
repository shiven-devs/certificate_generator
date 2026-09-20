"use client";

import { useState } from "react";
import { linkifyText } from "@/lib/text/linkify";

export function VideoDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 280 || text.split("\n").length > 4;
  const parts = linkifyText(text);

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">Description</h2>
      <p
        className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-300 ${
          expanded || !long ? "" : "line-clamp-4"
        }`}
      >
        {parts.map((part, index) =>
          part.type === "link" ? (
            <a
              key={`${part.href}-${index}`}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-[#81A1C1]"
            >
              {part.value}
            </a>
          ) : (
            <span key={`${index}-${part.value.slice(0, 12)}`}>{part.value}</span>
          ),
        )}
      </p>
      {long ? (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-indigo-700 hover:underline dark:text-[#81A1C1]"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
