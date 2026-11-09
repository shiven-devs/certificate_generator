"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { derivePageTitle } from "@/lib/notes/pages";
import type { PublicNotePage } from "@/lib/notes/types";
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
  sanitizeEditorPasteHtml,
  type NotesFormat,
} from "@/lib/notes/rich-text";

type NotesEditorProps = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
  pages: PublicNotePage[];
  activePageId: string | null;
  canAddPage: boolean;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
  autoFocus?: boolean;
};

export function NotesEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Write timestamps, summaries, or questions for this lesson.",
  pages,
  activePageId,
  canAddPage,
  onSelectPage,
  onAddPage,
  onDeletePage,
  autoFocus = false,
}: NotesEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  const editorId = useId();
  const skipSync = useRef(false);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [confirmDelete, setConfirmDelete] = useState(false);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || skipSync.current) {
      skipSync.current = false;
      return;
    }
    if (value === lastEmitted.current && editor.innerHTML !== "") {
      return;
    }
    const html = markdownToEditorHtml(value);
    if (editor.innerHTML !== html) {
      editor.innerHTML = html || "";
    }
    lastEmitted.current = value;
  }, [value]);

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.focus();
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (!confirmDelete) {
      return;
    }
    const timer = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  useEffect(() => {
    if (!activePageId) {
      return;
    }
    tabRefs.current
      .get(activePageId)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activePageId]);

  const emitFromEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    skipSync.current = true;
    const markdown = editorHtmlToMarkdown(editor.innerHTML);
    lastEmitted.current = markdown;
    onChange(markdown);
  }, [onChange]);

  const runFormat = useCallback(
    (format: NotesFormat) => {
      if (disabled) {
        return;
      }
      const editor = editorRef.current;
      if (!editor) {
        return;
      }
      editor.focus();

      if (format === "bold") {
        document.execCommand("bold");
      } else if (format === "italic") {
        document.execCommand("italic");
      } else if (format === "underline") {
        document.execCommand("underline");
      } else if (format === "heading1") {
        document.execCommand("formatBlock", false, "h1");
      } else if (format === "heading2") {
        document.execCommand("formatBlock", false, "h2");
      } else if (format === "heading3") {
        document.execCommand("formatBlock", false, "h3");
      } else if (format === "heading4") {
        document.execCommand("formatBlock", false, "h4");
      }

      emitFromEditor();
    },
    [disabled, emitFromEditor],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        runFormat("bold");
      } else if (key === "i") {
        event.preventDefault();
        runFormat("italic");
      } else if (key === "u") {
        event.preventDefault();
        runFormat("underline");
      }
    },
    [runFormat],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    function onPaste(event: ClipboardEvent) {
      event.preventDefault();
      const html = event.clipboardData?.getData("text/html");
      const text = event.clipboardData?.getData("text/plain") ?? "";
      if (html) {
        document.execCommand("insertHTML", false, sanitizeEditorPasteHtml(html));
      } else {
        document.execCommand("insertText", false, text);
      }
      emitFromEditor();
    }
    editor.addEventListener("paste", onPaste);
    return () => editor.removeEventListener("paste", onPaste);
  }, [emitFromEditor]);

  const onDeleteClick = useCallback(() => {
    if (!activePageId) {
      return;
    }
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setConfirmDelete(false);
    onDeletePage(activePageId);
  }, [activePageId, confirmDelete, onDeletePage]);

  return (
    <div className="flex min-h-40 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 dark:border-slate-700">
      {pages.length > 1 ? (
        // Never wraps: tab labels follow what is being typed, and a wrapping
        // strip would push the editor up and down on every keystroke.
        <div
          className="flex flex-nowrap items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-2 py-1 [scrollbar-width:none] dark:border-slate-800 dark:bg-slate-950 [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Note pages"
        >
          {pages.map((page, index) => {
            const title = derivePageTitle(page.body, index);
            const active = page.id === activePageId;
            return (
              <button
                key={page.id}
                ref={(node) => {
                  if (node) {
                    tabRefs.current.set(page.id, node);
                  } else {
                    tabRefs.current.delete(page.id);
                  }
                }}
                type="button"
                onClick={() => onSelectPage(page.id)}
                aria-current={active ? "true" : undefined}
                title={title}
                className={`h-7 max-w-32 shrink-0 truncate rounded-md px-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                  active
                    ? "bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
                    : "text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                {title}
              </button>
            );
          })}
        </div>
      ) : null}
      <div
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-950"
        role="toolbar"
        aria-label="Text formatting"
        aria-controls={editorId}
      >
        <ToolbarButton
          label="Bold"
          disabled={disabled}
          onClick={() => runFormat("bold")}
          className="font-bold"
        >
          B
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          disabled={disabled}
          onClick={() => runFormat("italic")}
          className="italic"
        >
          I
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          disabled={disabled}
          onClick={() => runFormat("underline")}
          className="underline"
        >
          U
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
        <ToolbarButton label="Heading 1" disabled={disabled} onClick={() => runFormat("heading1")}>
          H1
        </ToolbarButton>
        <ToolbarButton label="Heading 2" disabled={disabled} onClick={() => runFormat("heading2")}>
          H2
        </ToolbarButton>
        <ToolbarButton label="Heading 3" disabled={disabled} onClick={() => runFormat("heading3")}>
          H3
        </ToolbarButton>
        <ToolbarButton label="Heading 4" disabled={disabled} onClick={() => runFormat("heading4")}>
          H4
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
        <ToolbarButton
          label={canAddPage ? "New page" : "Page limit reached"}
          disabled={disabled || !canAddPage}
          onClick={onAddPage}
        >
          <PlusIcon />
        </ToolbarButton>
        {pages.length > 1 ? (
          <ToolbarButton
            label={confirmDelete ? "Click again to delete this page" : "Delete this page"}
            disabled={disabled}
            onClick={onDeleteClick}
            className={
              confirmDelete
                ? "text-rose-600 ring-1 ring-rose-400 hover:bg-rose-50 dark:text-rose-300 dark:ring-rose-700 dark:hover:bg-rose-950"
                : ""
            }
          >
            <TrashIcon />
          </ToolbarButton>
        ) : null}
      </div>
      <div
        id={editorId}
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label="Lesson notes"
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitFromEditor}
        onBlur={emitFromEditor}
        onKeyDown={onKeyDown}
        className="notes-editor min-h-32 flex-1 overflow-y-auto bg-white px-3 py-2 text-sm leading-6 text-slate-900 empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] focus:outline-none disabled:bg-slate-50 dark:bg-slate-950 dark:text-slate-100 dark:empty:before:text-slate-500 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 dark:[&_code]:bg-slate-800 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:mb-1 [&_h4]:text-base [&_h4]:font-semibold"
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
      />
    </svg>
  );
}

function ToolbarButton({
  label,
  disabled,
  onClick,
  className = "",
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => {
        // Keep editor selection when clicking the toolbar.
        event.preventDefault();
      }}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-indigo-200 dark:hover:bg-indigo-950 ${className}`}
    >
      {children}
    </button>
  );
}
