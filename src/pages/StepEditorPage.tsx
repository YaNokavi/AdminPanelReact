import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TiptapEditor, { type TiptapEditorRef } from "../components/TiptapEditor";
import TestEditor, { type TestData } from "../components/TestEditor";
import ToastContainer from "../components/ToastContainer";
import ConfirmDialog from "../components/ConfirmDialog";
import UnsavedChangesDialog from "../components/UnsavedChangesDialog";
import { useToast } from "../hooks/useToast";
import { fetchFileContent } from "../api/courses";
import {
  updateFile,
  editStep,
  createFile,
  deleteFile,
  createImage,
} from "../api/mutations";

export interface StepEditorState {
  stepId: number;
  stepNumber: number;
  isTest: boolean;
  contentUrl: string;
  submodulePath: string;
}

export interface HomeReturnState {
  returnPath: string;
}

const emptyTest = (): TestData => ({
  question: "",
  options: ["", "", "", ""],
  answer: [],
});

export default function StepEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const state = location.state as StepEditorState | null;

  useEffect(() => {
    if (!state) navigate("/", { replace: true });
  }, []); // eslint-disable-line

  // Путь назад, куда нужно вернуться после подтверждения выхода
  const pendingNavRef = useRef<(() => void) | null>(null);

  const navigateBack = useCallback(() => {
    if (!state) { navigate("/"); return; }
    navigate("/", { state: { returnPath: state.submodulePath } as HomeReturnState });
  }, [state, navigate]);

  const [isTest, setIsTest] = useState(state?.isTest ?? false);
  const [htmlContent, setHtmlContent] = useState("");
  const [testData, setTestData] = useState<TestData>(emptyTest());
  const [fileSha, setFileSha] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Оригинальные значения — берутся из нормализованного HTML редактора (через onReady)
  const initialTestData = useRef<string>("");
  const initialHtml = useRef<string>("");
  const pendingInitRef = useRef(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Модалка несохранённых изменений при выходе
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const editorRef = useRef<TiptapEditorRef>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const handleInsertImageRequest = () => imageInputRef.current?.click();

  // Попытка навигации назад: если есть dirty — показываем модалку,
  // иначе сразу уходим
  const goBack = useCallback(() => {
    if (dirty) {
      pendingNavRef.current = navigateBack;
      setShowUnsavedDialog(true);
    } else {
      navigateBack();
    }
  }, [dirty, navigateBack]);

  // Остаться на странице
  const handleStay = () => {
    pendingNavRef.current = null;
    setShowUnsavedDialog(false);
  };

  // Отменить изменения и выйти
  const handleDiscard = () => {
    setShowUnsavedDialog(false);
    const nav = pendingNavRef.current;
    pendingNavRef.current = null;
    nav?.();
  };

  // Сохранить и выйти
  const handleSaveAndLeave = async () => {
    await handleSave();
    const nav = pendingNavRef.current;
    pendingNavRef.current = null;
    setShowUnsavedDialog(false);
    nav?.();
  };

  const handleImageFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !state) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Только изображения");
        return;
      }
      setImageUploading(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const imagePath = `${state.submodulePath}/images/${file.name}`;
        const rawUrl = `https://raw.githubusercontent.com/YaNokavi/CunaEduFile/refs/heads/main/courses/${imagePath}`;
        try {
          await createImage({
            path: imagePath,
            content: base64,
            message: `Upload image ${file.name} via admin panel`,
          });
          editorRef.current?.insertImage(rawUrl);
          setDirty(true);
          toast.success("Изображение вставлено");
        } catch (err: unknown) {
          toast.error((err as Error).message ?? "Ошибка загрузки изображения");
        } finally {
          setImageUploading(false);
          if (imageInputRef.current) imageInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    },
    [state],
  ); // eslint-disable-line

  // ── Load content ───────────────────────────────────────────────────────────────
  const loadContent = useCallback(async () => {
    if (!state) return;
    setLoading(true);
    setDirty(false);
    try {
      const fileContentPath = `${state.submodulePath}/${state.stepId}.txt`;
      const res = await fetchFileContent(
        state.contentUrl,
        fileContentPath,
        state.isTest,
      );
      setFileSha(res.sha ?? "");
      if (state.isTest) {
        const raw = res.content.data;
        let parsed: TestData = emptyTest();
        if (typeof raw === "string") {
          try {
            const p = JSON.parse(raw);
            if (p && "question" in p) parsed = p as TestData;
          } catch {
            /* ignore */
          }
        } else if (raw && typeof raw === "object" && "question" in raw) {
          parsed = raw as TestData;
        }
        setTestData(parsed);
        initialTestData.current = JSON.stringify(parsed);
      } else {
        const html =
          typeof res.content.data === "string" ? res.content.data : "";
        pendingInitRef.current = true;
        setHtmlContent(html);
      }
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Не удалось загрузить шаг");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleEditorReady = useCallback((normalizedHtml: string) => {
    if (pendingInitRef.current) {
      initialHtml.current = normalizedHtml;
      pendingInitRef.current = false;
      setDirty(false);
    }
  }, []);

  const handleTestChange = (d: TestData) => {
    setTestData(d);
    setDirty(JSON.stringify(d) !== initialTestData.current);
  };

  const handleHtmlChange = (html: string) => {
    setHtmlContent(html);
    if (!pendingInitRef.current) {
      setDirty(html !== initialHtml.current);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!state) return;
    setSaving(true);
    const filePath = `${state.submodulePath}/${state.stepId}.txt`;
    const contentToSave = isTest
      ? JSON.stringify(testData, null, 2)
      : htmlContent;
    try {
      if (fileSha) {
        await updateFile({
          path: filePath,
          content: contentToSave,
          message: `Update step ${state.stepId} via admin panel`,
          sha: fileSha,
        });
      } else {
        await createFile({
          path: filePath,
          content: contentToSave,
          message: `Create step ${state.stepId} via admin panel`,
          image: false,
          is_test: isTest,
        });
      }
      toast.success("Шаг сохранён");
      setDirty(false);
      await loadContent();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle test/theory ───────────────────────────────────────────────────
  const handleToggleConfirm = async () => {
    if (!state) return;
    setToggling(true);
    const newIsTest = !isTest;
    try {
      await editStep(state.stepId, newIsTest);
      setIsTest(newIsTest);
      if (newIsTest) {
        const empty = emptyTest();
        setTestData(empty);
        initialTestData.current = JSON.stringify(empty);
      } else {
        setHtmlContent("");
        initialHtml.current = "";
      }
      setDirty(false);
      toast.success(`Тип изменён на «${newIsTest ? "Тест" : "Теория"}»`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка смены типа");
    } finally {
      setToggling(false);
      setShowToggleConfirm(false);
    }
  };

  // ── Delete step ────────────────────────────────────────────────────────────
  const handleDeleteStep = async () => {
    if (!state) return;
    setDeleting(true);
    try {
      await deleteFile({
        stepId: state.stepId,
        path: `${state.submodulePath}/${state.stepId}`,
        message: `Delete step ${state.stepId} via admin panel`,
        sha: fileSha,
      });
      toast.success("Шаг удалён");
      navigate("/", {
        replace: true,
        state: { returnPath: state.submodulePath } as HomeReturnState,
      });
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка удаления");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!state) return null;

  return (
    <div className="flex flex-col h-full">
      <ToastContainer toasts={toast.toasts} />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Top bar */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={goBack}
          className="p-1.5 text-text-muted hover:text-primary hover:bg-blue-50 rounded transition"
          title="Назад"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-text-heading truncate">
            Шаг {state.stepNumber}
          </h1>
          <p className="text-xs text-text-muted">{state.submodulePath}</p>
        </div>

        {/* Step type badge */}
        <button
          onClick={() => setShowToggleConfirm(true)}
          disabled={loading || toggling}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition disabled:opacity-50 ${
            isTest
              ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
              : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          }`}
          title="Нажмите, чтобы изменить тип"
        >
          {isTest ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Тест
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Теория
            </>
          )}
        </button>

        {dirty && (
          <span className="text-xs text-orange-500 font-medium">
            Несохранённые изменения
          </span>
        )}

        {imageUploading && (
          <span className="text-xs text-blue-500 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Загрузка...
          </span>
        )}

        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading || deleting}
          className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
          title="Удалить шаг"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {saving ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-text-muted">
            <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Загрузка содержимого...
          </div>
        ) : isTest ? (
          <TestEditor data={testData} onChange={handleTestChange} />
        ) : (
          <TiptapEditor
            ref={editorRef}
            content={htmlContent}
            onChange={handleHtmlChange}
            onInsertImageRequest={handleInsertImageRequest}
            onReady={handleEditorReady}
          />
        )}
      </div>

      {/* Модалка переключения типа */}
      <ConfirmDialog
        open={showToggleConfirm}
        message={`Сменить тип шага с «${isTest ? "Тест" : "Теория"}» на «${isTest ? "Теория" : "Тест"}»? Текущее содержимое будет очищено.`}
        onConfirm={handleToggleConfirm}
        onCancel={() => setShowToggleConfirm(false)}
        loading={toggling}
      />

      {/* Модалка удаления шага */}
      <ConfirmDialog
        open={showDeleteConfirm}
        message={`Удалить «Шаг ${state.stepNumber}»? Файл будет удалён с GitHub и запись из БД. Это действие необратимо.`}
        onConfirm={handleDeleteStep}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={deleting}
      />

      {/* Модалка несохранённых изменений */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        saving={saving}
        onStay={handleStay}
        onDiscard={handleDiscard}
        onSave={handleSaveAndLeave}
      />
    </div>
  );
}
