"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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
};

export function NotesEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Write timestamps, summaries, or questions for this lesson.",
}: NotesEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  const editorId = useId();
  const skipSync = useRef(false);

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

  return (
    <div className="flex min-h-40 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 dark:border-slate-700">
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
