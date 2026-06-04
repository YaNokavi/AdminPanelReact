import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TiptapEditor from "../components/TiptapEditor";
import TestEditor, { type TestData } from "../components/TestEditor";
import ToastContainer from "../components/ToastContainer";
import { useToast } from "../hooks/useToast";
import { fetchFileContent } from "../api/courses";
import { updateFile, editStep, createFile } from "../api/mutations";

export interface StepEditorState {
  stepId: number;
  stepNumber: number;
  isTest: boolean;
  contentUrl: string;
  submodulePath: string; // e.g. "courseId/moduleId/submoduleId"
}

export default function StepEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const state = location.state as StepEditorState | null;

  // ── Guard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state) navigate("/", { replace: true });
  }, []); // eslint-disable-line

  const [isTest, setIsTest] = useState(state?.isTest ?? false);
  const [htmlContent, setHtmlContent] = useState("");
  const [testData, setTestData] = useState<TestData>({ questions: [] });
  const [fileSha, setFileSha] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // ── Load content ─────────────────────────────────────────────────────────
  const loadContent = useCallback(async () => {
    if (!state) return;
    setLoading(true);
    try {
      const filePath = `${state.submodulePath}/${state.stepId}.txt`;
      const res = await fetchFileContent(state.contentUrl, filePath, state.isTest);
      setFileSha(res.sha ?? "");
      if (state.isTest) {
        const raw = res.content.data;
        if (typeof raw === "string") {
          try { setTestData(JSON.parse(raw)); } catch { setTestData({ questions: [] }); }
        } else {
          setTestData(raw as TestData);
        }
      } else {
        setHtmlContent(typeof res.content.data === "string" ? res.content.data : "");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Не удалось загрузить шаг");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { loadContent(); }, [loadContent]);

  // ── Save ──────────────────────────────────────────────────────────────────
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
          content: btoa(unescape(encodeURIComponent(contentToSave))),
          message: `Update step ${state.stepId} via admin panel`,
          sha: fileSha,
        });
      } else {
        await createFile({
          path: filePath,
          content: btoa(unescape(encodeURIComponent(contentToSave))),
          message: `Create step ${state.stepId} via admin panel`,
          image: false,
          is_test: isTest,
        });
      }
      toast.success("Шаг сохранён");
      setDirty(false);
      // refresh sha
      await loadContent();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle test/theory ───────────────────────────────────────────────────
  const handleToggleType = async () => {
    if (!state) return;
    const newIsTest = !isTest;
    try {
      await editStep(state.stepId, newIsTest);
      setIsTest(newIsTest);
      toast.success(`Тип изменён на «${newIsTest ? "Тест" : "Теория"}»`);
      setDirty(true);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка смены типа");
    }
  };

  if (!state) return null;

  return (
    <div className="flex flex-col h-full">
      <ToastContainer toasts={toast.toasts} />

      {/* Top bar */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
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

        {/* Step type badge + toggle */}
        <button
          onClick={handleToggleType}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
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
          <span className="text-xs text-orange-500 font-medium">Несохранённые изменения</span>
        )}

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
          <TestEditor
            data={testData}
            onChange={(d) => { setTestData(d); setDirty(true); }}
          />
        ) : (
          <TiptapEditor
            content={htmlContent}
            onChange={(html) => { setHtmlContent(html); setDirty(true); }}
          />
        )}
      </div>
    </div>
  );
}
