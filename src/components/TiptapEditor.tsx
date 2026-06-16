import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

import {
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";

export interface TiptapEditorRef {
  insertImage: (url: string) => void;
  getHTML: () => string;
}

interface Props {
  content: string;
  onChange: (html: string) => void;
}

// Расширяем Image: inline, сохраняем width / height / style из HTML
const CustomImage = Image.extend({
  inline() {
    return true;
  },
  group() {
    return "inline";
  },
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute("width") ?? null,
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      height: {
        default: null,
        parseHTML: (el) => el.getAttribute("height") ?? null,
        renderHTML: (attrs) => (attrs.height ? { height: attrs.height } : {}),
      },
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style") ?? null,
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

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
  ref,
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ hardBreak: false }),
      Underline,
      CustomImage.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: "Начните вводить содержимое шага...",
      }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      insertImage(url: string) {
        editor?.chain().focus().setImage({ src: url }).run();
      },
      getHTML() {
        return editor?.getHTML() ?? "";
      },
    }),
    [editor],
  );

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
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  // ── Image modal state ────────────────────────────────────────────────────────
  const [showImgModal, setShowImgModal] = useState(false);
  const [imgEditMode, setImgEditMode] = useState(false); // false = insert, true = edit
  const [imgUrl, setImgUrl] = useState("");
  const [imgWidth, setImgWidth] = useState("");
  const [imgHeight, setImgHeight] = useState("");
  const [imgStyle, setImgStyle] = useState("");
  const [imgError, setImgError] = useState("");

  // Открыть для вставки нового изображения
  const openImgModal = () => {
    setImgEditMode(false);
    setImgUrl("");
    setImgWidth("");
    setImgHeight("");
    setImgStyle("");
    setImgError("");
    setShowImgModal(true);
  };

  // Открыть для редактирования существующего изображения
  const openImgEditModal = useCallback(() => {
    if (!editor) return;
    const attrs = editor.getAttributes("image");
    setImgEditMode(true);
    setImgUrl((attrs.src as string) ?? "");
    setImgWidth((attrs.width as string) ?? "");
    setImgHeight((attrs.height as string) ?? "");
    setImgStyle((attrs.style as string) ?? "");
    setImgError("");
    setShowImgModal(true);
  }, [editor]);

  // Обработчик клика по EditorContent: если кликнули по изображению — открываем модалку редактирования
  const handleEditorClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        // Даём Tiptap время выставить selection на изображение, затем читаем атрибуты
        setTimeout(() => openImgEditModal(), 0);
      }
    },
    [openImgEditModal],
  );

  const validateAndGetAttrs = (): Record<string, string> | null => {
    const src = imgUrl.trim();
    if (!src) {
      setImgError("Укажите URL изображения");
      return null;
    }
    const wRaw = imgWidth.trim();
    const hRaw = imgHeight.trim();
    if (wRaw && (!/^\d+$/.test(wRaw) || Number(wRaw) < 1)) {
      setImgError("Ширина должна быть целым числом больше 0 (px)");
      return null;
    }
    if (hRaw && (!/^\d+$/.test(hRaw) || Number(hRaw) < 1)) {
      setImgError("Высота должна быть целым числом больше 0 (px)");
      return null;
    }
    const attrs: Record<string, string> = { src };
    if (wRaw) attrs.width = wRaw; else attrs.width = "";
    if (hRaw) attrs.height = hRaw; else attrs.height = "";
    const style = imgStyle.trim();
    attrs.style = style || "";
    return attrs;
  };

  const handleConfirmImg = () => {
    if (!editor) return;
    const attrs = validateAndGetAttrs();
    if (!attrs) return;

    if (imgEditMode) {
      // Обновляем атрибуты уже выбранного изображения
      editor.chain().focus().updateAttributes("image", attrs).run();
    } else {
      // Вставляем новое
      editor.chain().focus().setImage(attrs).run();
    }
    setShowImgModal(false);
  };

  if (!editor) return null;

  return (
    <>
      <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={btnCls(editor.isActive("bold"))}
            title="Bold"
          >
            <b>B</b>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={btnCls(editor.isActive("italic"))}
            title="Italic"
          >
            <i>I</i>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={btnCls(editor.isActive("underline"))}
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={btnCls(editor.isActive("strike"))}
            title="Strike"
          >
            <s>S</s>
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={btnCls(editor.isActive("heading", { level: 1 }))}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={btnCls(editor.isActive("heading", { level: 2 }))}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={btnCls(editor.isActive("heading", { level: 3 }))}
          >
            H3
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={btnCls(editor.isActive("bulletList"))}
            title="Список"
          >
            • —
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={btnCls(editor.isActive("orderedList"))}
            title="Нумерованный список"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={btnCls(editor.isActive("blockquote"))}
            title="Цитата"
          >
            &ldquo;&rdquo;
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={btnCls(editor.isActive("codeBlock"))}
            title="Код"
          >
            {"</>"}{" "}
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={setLink}
            className={btnCls(editor.isActive("link"))}
            title="Ссылка"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={openImgModal}
            className={btnCls(false)}
            title="Вставить изображение"
          >
            🖼
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            className={btnCls(false)}
            title="Отменить"
          >
            ↩
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            className={btnCls(false)}
            title="Повторить"
          >
            ↪
          </button>
        </div>

        {/* Обёртка: перехватываем клик по изображению */}
        <div onClick={handleEditorClick}>
          <EditorContent
            editor={editor}
            className="tiptap-editor-content p-4 min-h-[300px] overflow-x-hidden min-w-0"
          />
        </div>
      </div>

      {/* Image modal (вставка / редактирование) */}
      {showImgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-text-heading mb-4">
              {imgEditMode ? "Редактировать изображение" : "Вставить изображение"}
            </h2>
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
                  onChange={(e) => { setImgUrl(e.target.value); setImgError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirmImg()}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-heading mb-1">
                    Ширина
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={inputCls + " pr-9"}
                      placeholder="—"
                      value={imgWidth}
                      onChange={(e) => { setImgWidth(e.target.value); setImgError(""); }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                      px
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-heading mb-1">
                    Высота
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={inputCls + " pr-9"}
                      placeholder="—"
                      value={imgHeight}
                      onChange={(e) => { setImgHeight(e.target.value); setImgError(""); }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                      px
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1">
                  Style{" "}
                  <span className="text-text-muted text-xs font-normal">(необязательно)</span>
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="напр. vertical-align: middle"
                  value={imgStyle}
                  onChange={(e) => { setImgStyle(e.target.value); setImgError(""); }}
                />
              </div>
              {imgError && (
                <p className="text-sm text-red-500">{imgError}</p>
              )}
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
                onClick={handleConfirmImg}
                disabled={!imgUrl.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50"
              >
                {imgEditMode ? "Сохранить" : "Вставить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default TiptapEditor;
