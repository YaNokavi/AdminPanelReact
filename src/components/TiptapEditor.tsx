import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback } from "react";

interface Props {
  content: string;
  onChange: (html: string) => void;
  onInsertImageRequest?: () => void;
}

const btnCls = (active: boolean) =>
  `px-2 py-1 rounded text-sm transition ${
    active
      ? "bg-primary text-white"
      : "bg-gray-100 hover:bg-gray-200 text-text-heading"
  }`;

export default function TiptapEditor({ content, onChange, onInsertImageRequest }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Начните вводить содержимое шага..." }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes (e.g. on load)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content]); // eslint-disable-line

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL ссылки:", prev ?? "");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive("bold"))} title="Bold"><b>B</b></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive("italic"))} title="Italic"><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnCls(editor.isActive("underline"))} title="Underline"><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnCls(editor.isActive("strike"))} title="Strike"><s>S</s></button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnCls(editor.isActive("heading", { level: 1 }))}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnCls(editor.isActive("heading", { level: 2 }))}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnCls(editor.isActive("heading", { level: 3 }))}>H3</button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive("bulletList"))} title="Список">• —</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnCls(editor.isActive("orderedList"))} title="Нумерованный список">1.</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnCls(editor.isActive("blockquote"))} title="Цитата">&ldquo;&rdquo;</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnCls(editor.isActive("codeBlock"))} title="Код">{"</>"}  </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={setLink} className={btnCls(editor.isActive("link"))} title="Ссылка">🔗</button>
        {onInsertImageRequest && (
          <button type="button" onClick={onInsertImageRequest} className={btnCls(false)} title="Вставить изображение">🖼</button>
        )}
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnCls(false)} title="Отменить">↩</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnCls(false)} title="Повторить">↪</button>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none"
      />
    </div>
  );
}
