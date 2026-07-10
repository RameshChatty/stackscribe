"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Tell your technical story…",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "tiptap prose min-h-[420px] max-w-none px-2 py-5",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const controls = [
    {
      label: "Bold",
      icon: Bold,
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Heading",
      icon: Heading2,
      active: editor.isActive("heading", { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bulleted list",
      icon: List,
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      icon: Quote,
      active: editor.isActive("blockquote"),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Code block",
      icon: Code2,
      active: editor.isActive("codeBlock"),
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-surface/95 p-2 backdrop-blur">
        {controls.map(({ label, icon: Icon, active, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground",
              active && "bg-surface-muted text-foreground",
            )}
            title={label}
            aria-label={label}
            aria-pressed={active}
          >
            <Icon size={17} />
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-border" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-muted disabled:opacity-30"
          title="Undo"
          aria-label="Undo"
        >
          <Undo2 size={17} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-muted disabled:opacity-30"
          title="Redo"
          aria-label="Redo"
        >
          <Redo2 size={17} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
