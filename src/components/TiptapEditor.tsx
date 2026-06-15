import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useImperativeHandle, forwardRef, useState } from "react";

export interface TiptapEditorRef {
  insertImage: (url: string) => void;
  getHTML: () => string;
}

interface Props {
  content: string;
  onChange: (html: string) => void;
}

const btnCls = (active: boolean) =>
  `px-2 py-1 rounded text-sm transition ${
    active
      ? "bg-primary text-white"
      : "bg-gray-100 hover:bg-gray-200 text-text-heading"
  }`;

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition";

const TiptapEditor = forwardRef<TiptapEditorRef, Props>(function TiptapEditor(
  { content, onChange },
  ref
) {
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

  useImperativeHandle(ref, () => ({
    insertImage(url: string) {
      editor?.chain().focus().setImage({ src: url }).run();
    },
    getHTML() {
      return editor?.getHTML() ?? "";
    },
  }), [editor]);

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

  // ── Image insert modal ────────────────────────────────────────────────────
  const [showImgModal, setShowImgModal] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [imgWidth, setImgWidth] = useState("");
  const [imgHeight, setImgHeight] = useState("");

  const openImgModal = () => {
    setImgUrl("");
    setImgWidth("");
    setImgHeight("");
    setShowImgModal(true);
  };

  const handleInsertImg = () => {
    if (!editor || !imgUrl.trim()) return;
    const attrs: Record<string, string> = { src: imgUrl.trim() };
    if (imgWidth.trim()) attrs.width = imgWidth.trim();
    if (imgHeight.trim()) attrs.height = imgHeight.trim();
    editor.chain().focus().setImage(attrs).run();
    setShowImgModal(false);
  };

  if (!editor) return null;

  return (
    <>
      <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col min-w-0">
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
          <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnCls(editor.isActive("codeBlock"))} title="Код">{"</>"}</button>
          <div className="w-px bg-gray-300 mx-1" />
          <button type="button" onClick={setLink} className={btnCls(editor.isActive("link"))} title="Ссылка">🔗</button>
          <button type="button" onClick={openImgModal} className={btnCls(false)} title="Вставить изображение">🖼</button>
          <div className="w-px bg-gray-300 mx-1" />
          <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnCls(false)} title="Отменить">↩</button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnCls(false)} title="Повторить">↪</button>
        </div>
        <EditorContent
          editor={editor}
          className="tiptap-editor-content p-4 min-h-[300px] overflow-x-hidden min-w-0"
        />
      </div>

      {/* Image insert modal */}
      {showImgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-text-heading mb-4">Вставить изображение</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1">
                  URL изображения <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  className={inputCls}
                  placeholder="https://raw.githubusercontent.com/..."
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInsertImg()}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-heading mb-1">Ширина</label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="напр. 600 или 80%"
                    value={imgWidth}
                    onChange={(e) => setImgWidth(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-heading mb-1">Высота</label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="напр. 400"
                    value={imgHeight}
                    onChange={(e) => setImgHeight(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowImgModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleInsertImg}
                disabled={!imgUrl.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50"
              >
                Вставить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default TiptapEditor;
