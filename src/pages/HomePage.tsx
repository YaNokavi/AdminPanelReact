import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FileItem, { type NavItem, type ItemKind } from "../components/FileItem";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import ToastContainer from "../components/ToastContainer";
import { useToast } from "../hooks/useToast";
import { fetchCourses, fetchFileContent, fetchSteps, fetchModules, fetchSubmodules, fetchFolderImages } from "../api/courses";
import type { Course, ImageFile } from "../api/courses";
import {
  createCourse,
  editCourse,
  createDirectory,
  renameItem,
  createImage,
  generateMigration,
  createFile,
  deleteFile,
  deleteDirectory,
  deleteImage,
} from "../api/mutations";
import type { StepEditorState, HomeReturnState } from "./StepEditorPage";

export interface BreadcrumbItem {
  label: string;
  items: NavItem[];
  kind: ItemKind;
  path: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function courseToNavItem(c: Course): NavItem {
  return {
    id: c.id,
    name: c.name,
    kind: "course",
    icon: c.icon,
    author: c.author,
    description: c.description,
    rating: c.rating,
    modules:
      c.modules?.map((m) => ({
        id: m.id,
        name: m.name,
        kind: "module" as ItemKind,
        submodules:
          m.submodules?.map((s) => ({
            id: s.id,
            name: s.name,
            kind: "submodule" as ItemKind,
            steps:
              s.steps?.map((st) => ({
                id: st.id,
                name: `Шаг ${st.number}`,
                kind: "step" as ItemKind,
                isTest: st.is_test,
                number: st.number,
                contentUrl: st.content_url,
              })) ?? [],
          })) ?? [],
      })) ?? [],
  };
}

function getChildItems(item: NavItem): NavItem[] {
  if (item.kind === "course") return item.modules ?? [];
  if (item.kind === "module") return item.submodules ?? [];
  if (item.kind === "submodule") return item.steps ?? [];
  return [];
}

function getChildKind(item: NavItem): ItemKind {
  if (item.kind === "course") return "module";
  if (item.kind === "module") return "submodule";
  return "step";
}

function buildPath(crumbs: BreadcrumbItem[]): string {
  return crumbs
    .filter((c) => c.path !== "")
    .map((c) => c.path)
    .join("/");
}

function countSteps(item: NavItem): number {
  if (item.kind === "step") return 1;
  if (item.kind === "submodule") return (item.steps ?? []).length;
  if (item.kind === "module")
    return (item.submodules ?? []).reduce((s, sm) => s + (sm.steps ?? []).length, 0);
  if (item.kind === "course")
    return (item.modules ?? []).reduce(
      (s, m) => s + (m.submodules ?? []).reduce((ss, sm) => ss + (sm.steps ?? []).length, 0),
      0,
    );
  return 0;
}

// ── field component ───────────────────────────────────────────────────────────

function Field({
  label, id, value, onChange, type = "text", placeholder, required, min, max, textarea,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
  min?: number; max?: number; textarea?: boolean;
}) {
  const cls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition";
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-heading mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea id={id} className={cls} rows={3} value={value} placeholder={placeholder}
          required={required} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type={type} className={cls} value={value} placeholder={placeholder}
          required={required} min={min} max={max} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function HomePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [allCourses, setAllCourses] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: "Главная", items: [], kind: "course", path: "" },
  ]);

  const currentCrumb = breadcrumbs[breadcrumbs.length - 1];
  const isRoot = breadcrumbs.length === 1;
  const currentItems = isRoot ? allCourses : currentCrumb.items;
  const currentLevel = currentCrumb.kind;

  // ── images state ────────────────────────────────────────────────────────
  const [submoduleImages, setSubmoduleImages] = useState<ImageFile[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [confirmImage, setConfirmImage] = useState<ImageFile | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);

  const isAtSubmodule = currentLevel === "step";

  const loadSubmoduleImages = useCallback(async (path: string) => {
    setImagesLoading(true);
    try {
      const folders = await fetchFolderImages(path);
      const images = folders.flatMap((f) => f.images ?? []);
      setSubmoduleImages(images);
    } catch {
      setSubmoduleImages([]);
    } finally {
      setImagesLoading(false);
    }
  }, []);

  // Загружаем изображения каждый раз при переходе в сабмодуль
  useEffect(() => {
    if (isAtSubmodule) {
      loadSubmoduleImages(buildPath(breadcrumbs));
    } else {
      setSubmoduleImages([]);
    }
  }, [breadcrumbs]); // eslint-disable-line

  const handleDeleteImage = async () => {
    if (!confirmImage) return;
    setDeletingImage(true);
    try {
      // Получаем sha файла перед удалением
      const fileContent = await fetchFileContent(
        confirmImage.content_url,
        confirmImage.path,
        false,
      );
      await deleteImage({
        path: confirmImage.path,
        message: `Delete image ${confirmImage.name} via admin panel`,
        sha: fileContent.sha,
      });
      toast.success("Изображение удалено");
      setSubmoduleImages((prev) => prev.filter((img) => img.path !== confirmImage.path));
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка удаления изображения");
    } finally {
      setDeletingImage(false);
      setConfirmImage(null);
    }
  };

  // ── load courses ─────────────────────────────────────────────────────────
  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCourses();
      setAllCourses(data.map(courseToNavItem));
    } catch {
      toast.error("Не удалось загрузить курсы");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  // ── restore breadcrumbs from returnPath (after back from StepEditorPage) ───
  useEffect(() => {
    const returnState = location.state as HomeReturnState | null;
    const returnPath = returnState?.returnPath;
    if (!returnPath) {
      loadCourses();
      return;
    }

    const segments = returnPath.split("/").filter(Boolean);

    const restoreAndLoad = async () => {
      setLoading(true);
      try {
        const data = await fetchCourses();
        const courses = data.map(courseToNavItem);
        setAllCourses(courses);

        const newCrumbs: BreadcrumbItem[] = [
          { label: "Главная", items: [], kind: "course", path: "" },
        ];

        if (segments.length >= 1) {
          const courseId = segments[0];
          const course = courses.find((c) => String(c.id) === courseId);
          if (course) {
            newCrumbs.push({ label: course.name, items: course.modules ?? [], kind: "module", path: courseId });
          }
        }

        if (segments.length >= 2 && newCrumbs.length === 2) {
          const moduleId = segments[1];
          const mod = newCrumbs[1].items.find((m) => String(m.id) === moduleId);
          if (mod) {
            newCrumbs.push({ label: mod.name, items: mod.submodules ?? [], kind: "submodule", path: moduleId });
          }
        }

        if (segments.length >= 3 && newCrumbs.length === 3) {
          const submoduleId = segments[2];
          const sub = newCrumbs[2].items.find((s) => String(s.id) === submoduleId);
          if (sub) {
            newCrumbs.push({ label: sub.name, items: sub.steps ?? [], kind: "step", path: submoduleId });
          }
        }

        setBreadcrumbs(newCrumbs);
        window.history.replaceState({}, "");
      } catch {
        toast.error("Не удалось загрузить курсы");
      } finally {
        setLoading(false);
      }
    };

    restoreAndLoad();
  }, []); // eslint-disable-line

  // ── navigation ───────────────────────────────────────────────────────────
  const navigateTo = (item: NavItem) => {
    if (item.kind === "step") {
      const state: StepEditorState = {
        stepId: item.id as number,
        stepNumber: item.number ?? (item.id as number),
        isTest: item.isTest ?? false,
        contentUrl: item.contentUrl ?? "",
        submodulePath: buildPath(breadcrumbs),
      };
      navigate("/step-editor", { state });
      return;
    }
    const children = getChildItems(item);
    const childKind = getChildKind(item);
    setBreadcrumbs((prev) => [
      ...prev,
      { label: item.name, items: children, kind: childKind, path: String(item.id) },
    ]);
  };

  const navigateToCrumb = (index: number) => {
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  // ── delete ───────────────────────────────────────────────────────────────
  const [confirmItem, setConfirmItem] = useState<NavItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const deleteMessage = (() => {
    if (!confirmItem) return "";
    const steps = countSteps(confirmItem);
    const label = confirmItem.kind === "step" ? `Шаг ${confirmItem.number ?? confirmItem.id}` : confirmItem.name;
    const extra = steps > 0 ? ` Будет удалено ${steps} шаг(ов) вместе со всем содержимым.` : "";
    return `Удалить «${label}»?${extra} Это действие необратимо.`;
  })();

  const handleDeleteConfirm = async () => {
    if (!confirmItem) return;
    setDeleteLoading(true);
    try {
      if (confirmItem.kind === "step") {
        const submodulePath = buildPath(breadcrumbs);
        const fileContentPath = `${submodulePath}/${confirmItem.id}.txt`;
        const deletePath = `${submodulePath}/${confirmItem.id}`;
        const contentUrl = confirmItem.contentUrl ?? "";

        let sha = "";
        try {
          const res = await fetchFileContent(contentUrl, fileContentPath, confirmItem.isTest ?? false);
          sha = res.sha ?? "";
        } catch { /* файла нет на GitHub — ок */ }

        await deleteFile({
          stepId: confirmItem.id as number,
          path: deletePath,
          message: `Delete step ${confirmItem.id} via admin panel`,
          sha,
        });
        toast.success("Шаг удалён");

        setBreadcrumbs((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, items: last.items.filter((i) => i.id !== confirmItem.id) }];
        });
        loadCourses();
      } else {
        const currentPath = buildPath(breadcrumbs);
        const itemPath = currentPath ? `${currentPath}/${confirmItem.id}` : String(confirmItem.id);
        const typeMap = { course: "course", module: "module", submodule: "submodule" } as const;

        await deleteDirectory({
          id: confirmItem.id as number,
          type: typeMap[confirmItem.kind as "course" | "module" | "submodule"],
          path: itemPath,
          message: `Delete ${confirmItem.kind} ${confirmItem.id} via admin panel`,
        });

        const kindRu = confirmItem.kind === "course" ? "Курс" : confirmItem.kind === "module" ? "Модуль" : "Подмодуль";
        toast.success(`${kindRu} удалён`);

        const itemIsCurrentLevel = breadcrumbs[breadcrumbs.length - 1].path === String(confirmItem.id);
        if (itemIsCurrentLevel) {
          setBreadcrumbs((prev) => prev.slice(0, -1));
        } else {
          setBreadcrumbs((prev) => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, items: last.items.filter((i) => i.id !== confirmItem.id) }];
          });
        }
        loadCourses();
      }
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка удаления");
    } finally {
      setDeleteLoading(false);
      setConfirmItem(null);
    }
  };

  // ── create course modal ───────────────────────────────────────────────────
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [ccName, setCcName] = useState("");
  const [ccAuthor, setCcAuthor] = useState("");
  const [ccDesc, setCcDesc] = useState("");
  const [ccIcon, setCcIcon] = useState("");
  const [ccRating, setCcRating] = useState("5");
  const [ccLoading, setCcLoading] = useState(false);

  const handleCreateCourse = async () => {
    if (!ccName.trim() || !ccAuthor.trim() || !ccDesc.trim()) {
      toast.error("Заполните обязательные поля"); return;
    }
    setCcLoading(true);
    try {
      await createCourse({ name: ccName, author: ccAuthor, description: ccDesc, icon: ccIcon, message: "Create course via admin panel" });
      toast.success("Курс успешно создан");
      setShowCreateCourse(false);
      setCcName(""); setCcAuthor(""); setCcDesc(""); setCcIcon(""); setCcRating("5");
      loadCourses();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Не удалось создать курс");
    } finally { setCcLoading(false); }
  };

  // ── edit course modal ─────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<NavItem | null>(null);
  const [ecName, setEcName] = useState("");
  const [ecAuthor, setEcAuthor] = useState("");
  const [ecDesc, setEcDesc] = useState("");
  const [ecIcon, setEcIcon] = useState("");
  const [ecRating, setEcRating] = useState("5");
  const [ecLoading, setEcLoading] = useState(false);

  const openEditCourse = (item: NavItem) => {
    setEditTarget(item); setEcName(item.name); setEcAuthor(item.author ?? "");
    setEcDesc(item.description ?? ""); setEcIcon(item.icon ?? ""); setEcRating(String(item.rating ?? 5));
  };

  const handleEditCourse = async () => {
    if (!editTarget) return;
    if (!ecName.trim() || !ecAuthor.trim() || !ecDesc.trim()) {
      toast.error("Заполните обязательные поля"); return;
    }
    setEcLoading(true);
    try {
      await editCourse({ id: editTarget.id as number, name: ecName, author: ecAuthor, description: ecDesc, icon: ecIcon });
      toast.success("Курс успешно отредактирован");
      setEditTarget(null);
      loadCourses();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Не удалось отредактировать курс");
    } finally { setEcLoading(false); }
  };

  // ── create directory modal ────────────────────────────────────────────────
  const [showCreateDir, setShowCreateDir] = useState(false);
  const [cdName, setCdName] = useState("");
  const [cdLoading, setCdLoading] = useState(false);
  const dirKind: "module" | "submodule" = currentLevel === "module" ? "module" : "submodule";

  const handleCreateDir = async () => {
    if (!cdName.trim()) { toast.error("Введите имя"); return; }
    setCdLoading(true);
    const path = buildPath(breadcrumbs);
    try {
      await createDirectory({ path: `${path}/${cdName}`, type: dirKind, message: `Create ${dirKind} via admin panel` });

      if (dirKind === "module") {
        const modules = await fetchModules(path);
        const moduleItems: NavItem[] = modules.map((m) => ({
          id: m.id, name: m.name, kind: "module",
          submodules: m.submodules?.map((s) => ({
            id: s.id, name: s.name, kind: "submodule" as ItemKind,
            steps: s.steps?.map((st) => ({ id: st.id, name: `Шаг ${st.number}`, kind: "step" as ItemKind, isTest: st.is_test, number: st.number, contentUrl: st.content_url })) ?? [],
          })) ?? [],
        }));
        setBreadcrumbs((prev) => { const last = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...last, items: moduleItems }]; });
      } else {
        const submodules = await fetchSubmodules(path);
        const submoduleItems: NavItem[] = submodules.map((s) => ({
          id: s.id, name: s.name, kind: "submodule",
          steps: s.steps?.map((st) => ({ id: st.id, name: `Шаг ${st.number}`, kind: "step" as ItemKind, isTest: st.is_test, number: st.number, contentUrl: st.content_url })) ?? [],
        }));
        setBreadcrumbs((prev) => { const last = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...last, items: submoduleItems }]; });
      }

      toast.success(`${dirKind === "module" ? "Модуль" : "Подмодуль"} создан`);
      setShowCreateDir(false); setCdName("");
      loadCourses();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка создания");
    } finally { setCdLoading(false); }
  };

  // ── create step modal ─────────────────────────────────────────────────────
  const [showCreateStep, setShowCreateStep] = useState(false);
  const [csIsTest, setCsIsTest] = useState(false);
  const [csLoading, setCsLoading] = useState(false);

  const handleCreateStep = async () => {
    setCsLoading(true);
    const submodulePath = buildPath(breadcrumbs);
    const defaultContent = csIsTest
      ? JSON.stringify({ question: "", options: ["", "", "", ""], answer: [] }, null, 2)
      : "<p></p>";
    try {
      await createFile({ path: submodulePath, content: defaultContent, message: "Create step via admin panel", image: false, is_test: csIsTest });

      const steps = await fetchSteps(submodulePath);
      const stepItems: NavItem[] = steps.map((st) => ({
        id: st.id, name: `Шаг ${st.number}`, kind: "step",
        isTest: st.is_test, number: st.number, contentUrl: st.content_url,
      }));
      setBreadcrumbs((prev) => { const last = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...last, items: stepItems }]; });

      toast.success(`Шаг создан (${csIsTest ? "Тест" : "Теория"})`);
      setShowCreateStep(false); setCsIsTest(false);
      loadCourses();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка создания шага");
    } finally { setCsLoading(false); }
  };

  // ── rename modal ──────────────────────────────────────────────────────────
  const [renameTarget, setRenameTarget] = useState<NavItem | null>(null);
  const [rnName, setRnName] = useState("");
  const [rnLoading, setRnLoading] = useState(false);

  const openRename = (item: NavItem) => { setRenameTarget(item); setRnName(item.name); };

  const handleRename = async () => {
    if (!renameTarget || !rnName.trim() || rnName === renameTarget.name) {
      toast.info("Нет изменений"); return;
    }
    setRnLoading(true);
    const path = `${buildPath(breadcrumbs)}/${renameTarget.id}`;
    const fileTypeName = renameTarget.kind === "course" ? "course" : renameTarget.kind === "module" ? "module" : "submodule";
    try {
      await renameItem({ path, fileTypeName, newName: rnName });
      toast.success("Переименовано");
      setRenameTarget(null);
      loadCourses();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка переименования");
    } finally { setRnLoading(false); }
  };

  // ── image upload ──────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) { toast.error("Только изображения"); return; }
      setUploadLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const path = `${buildPath(breadcrumbs)}/${file.name}`;
        try {
          await createImage({ path, content: base64, message: "Upload image via admin panel" });
          toast.success("Изображение загружено");
          // Обновить список изображений если находимся внутри сабмодуля
          if (isAtSubmodule) loadSubmoduleImages(buildPath(breadcrumbs));
        } catch (err: unknown) {
          toast.error((err as Error).message ?? "Ошибка загрузки");
        } finally { setUploadLoading(false); }
      };
      reader.readAsDataURL(file);
    },
    [breadcrumbs, isAtSubmodule], // eslint-disable-line
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  // ── generate migration ────────────────────────────────────────────────────
  const [migLoading, setMigLoading] = useState(false);

  const handleGenerateMigration = async () => {
    setMigLoading(true);
    try {
      const sql = await generateMigration();
      const blob = new Blob([sql], { type: "application/sql" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "migration.sql"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Миграция сгенерирована");
    } catch {
      toast.error("Не удалось сгенерировать миграцию");
    } finally { setMigLoading(false); }
  };

  const canCreateDir = currentLevel === "module" || currentLevel === "submodule";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 max-w-5xl w-full mx-auto">
      <ToastContainer toasts={toast.toasts} />

      {/* Hero */}
      <section className="bg-white rounded-xl shadow-sm border border-border p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-heading mb-2">Управление курсами</h1>
            <p className="text-text-muted text-sm leading-relaxed">
              Создавайте учебные материалы, редактируйте контент и генерируйте миграции.
            </p>
          </div>
          {isRoot && (
            <button onClick={() => setShowCreateCourse(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Создать курс
            </button>
          )}
        </div>
      </section>

      {/* Info cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { bg: "bg-blue-50", color: "text-primary", label: "Иерархия", sub: "Курс → Модуль → Подмодуль → Шаг",
            icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
          { bg: "bg-green-50", color: "text-green-600", label: "Git-хранение", sub: "Контент версионируется в GitHub",
            icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
          { bg: "bg-purple-50", color: "text-purple-600", label: "Курсов загружено", sub: loading ? "Загрузка..." : `${allCourses.length} курс(ов)`,
            icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-border p-5 flex items-start gap-4">
            <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-5 h-5 ${c.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={c.icon} />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-heading">{c.label}</p>
              <p className="text-xs text-text-muted mt-1">{c.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* File section */}
      <section className="bg-white rounded-xl shadow-sm border border-border p-6 mb-24">
        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-5 text-center text-text-muted text-sm cursor-pointer transition mb-5 ${
            dragOver ? "border-primary bg-blue-50/40" : "border-gray-300 hover:border-primary hover:bg-blue-50/20"
          } ${uploadLoading ? "opacity-50 pointer-events-none" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="w-7 h-7 mx-auto mb-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {uploadLoading ? "Загрузка..." : "Перетащите изображение или нажмите для выбора"}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-5">
          {canCreateDir && (
            <button onClick={() => setShowCreateDir(true)}
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3 py-2 rounded-lg transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Создать {dirKind === "module" ? "модуль" : "подмодуль"}
            </button>
          )}
          {isAtSubmodule && (
            <button onClick={() => setShowCreateStep(true)}
              className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Добавить шаг
            </button>
          )}
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center flex-wrap gap-1 text-sm mb-4">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">/</span>}
              <button onClick={() => navigateToCrumb(i)}
                className={`px-1.5 py-0.5 rounded transition ${
                  i === breadcrumbs.length - 1
                    ? "font-semibold text-text-heading cursor-default"
                    : "text-text-muted hover:text-primary hover:bg-blue-50"
                }`}>
                {crumb.label}
              </button>
            </span>
          ))}
        </nav>

        {/* Steps list */}
        <div className="text-xs font-semibold text-text-light uppercase tracking-wide mb-2">
          {loading && isRoot ? "Загрузка..." : `Содержимое · ${currentItems.length} элем.`}
        </div>

        {loading && isRoot ? (
          <div className="flex items-center justify-center py-12 text-text-muted">
            <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Загрузка курсов...
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-10 text-gray-400 border border-dashed rounded-lg text-sm">Пусто</div>
        ) : (
          <ul className="space-y-1.5">
            {currentItems.map((item) => (
              <FileItem
                key={item.id}
                item={item}
                breadcrumb={breadcrumbs}
                onOpen={navigateTo}
                onRename={item.kind !== "step" ? openRename : undefined}
                onDelete={() => setConfirmItem(item)}
                onEdit={item.kind === "course" ? openEditCourse : undefined}
              />
            ))}
          </ul>
        )}

        {/* Images section — показывается только внутри сабмодуля */}
        {isAtSubmodule && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-text-light uppercase tracking-wide">
                Изображения · {imagesLoading ? "загрузка..." : `${submoduleImages.length} файл.`}
              </span>
            </div>

            {imagesLoading ? (
              <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Загрузка изображений...
              </div>
            ) : submoduleImages.length === 0 ? (
              <div className="text-center py-6 text-gray-400 border border-dashed rounded-lg text-sm">
                Нет изображений. Перетащите файл выше чтобы добавить.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {submoduleImages.map((img) => (
                  <div key={img.path} className="group relative rounded-lg border border-border overflow-hidden bg-gray-50">
                    <img
                      src={img.content_url}
                      alt={img.name}
                      className="w-full h-28 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                    />
                    <div className="p-2">
                      <p className="text-xs text-text-muted truncate" title={img.name}>{img.name}</p>
                    </div>
                    <button
                      onClick={() => setConfirmImage(img)}
                      className="absolute top-1.5 right-1.5 p-1 bg-white/80 hover:bg-red-50 text-text-muted hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition"
                      title="Удалить изображение"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Floating migration button */}
      <button onClick={handleGenerateMigration} disabled={migLoading}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg transition flex items-center gap-2 z-40">
        {migLoading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        )}
        {migLoading ? "Генерация..." : "Сгенерировать миграцию"}
      </button>

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      {/* Create course */}
      <Modal open={showCreateCourse} title="Создать курс" onClose={() => setShowCreateCourse(false)}
        footer={
          <>
            <button onClick={() => setShowCreateCourse(false)} disabled={ccLoading}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition disabled:opacity-50">Отмена</button>
            <button onClick={handleCreateCourse} disabled={ccLoading}
              className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50">
              {ccLoading ? "Создание..." : "Создать"}
            </button>
          </>
        }>
        <div className="space-y-4">
          <Field label="Название" id="cc-name" value={ccName} onChange={setCcName} required placeholder="Технический анализ" />
          <Field label="Автор" id="cc-author" value={ccAuthor} onChange={setCcAuthor} required placeholder="Иван Иванов" />
          <Field label="Описание" id="cc-desc" value={ccDesc} onChange={setCcDesc} required textarea placeholder="Краткое описание курса" />
          <Field label="URL иконки" id="cc-icon" value={ccIcon} onChange={setCcIcon} placeholder="https://..." />
          <Field label="Рейтинг" id="cc-rating" type="number" value={ccRating} onChange={setCcRating} min={1} max={5} />
        </div>
      </Modal>

      {/* Edit course */}
      <Modal open={!!editTarget} title="Редактировать курс" onClose={() => setEditTarget(null)}
        footer={
          <>
            <button onClick={() => setEditTarget(null)} disabled={ecLoading}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition disabled:opacity-50">Отмена</button>
            <button onClick={handleEditCourse} disabled={ecLoading}
              className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50">
              {ecLoading ? "Сохранение..." : "Сохранить"}
            </button>
          </>
        }>
        <div className="space-y-4">
          <Field label="Название" id="ec-name" value={ecName} onChange={setEcName} required />
          <Field label="Автор" id="ec-author" value={ecAuthor} onChange={setEcAuthor} required />
          <Field label="Описание" id="ec-desc" value={ecDesc} onChange={setEcDesc} required textarea />
          <Field label="URL иконки" id="ec-icon" value={ecIcon} onChange={setEcIcon} />
          <Field label="Рейтинг" id="ec-rating" type="number" value={ecRating} onChange={setEcRating} min={1} max={5} />
        </div>
      </Modal>

      {/* Create directory */}
      <Modal open={showCreateDir} title={`Создать ${dirKind === "module" ? "модуль" : "подмодуль"}`}
        onClose={() => setShowCreateDir(false)}
        footer={
          <>
            <button onClick={() => setShowCreateDir(false)} disabled={cdLoading}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition disabled:opacity-50">Отмена</button>
            <button onClick={handleCreateDir} disabled={cdLoading}
              className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50">
              {cdLoading ? "Создание..." : "Создать"}
            </button>
          </>
        }>
        <Field label="Название" id="cd-name" value={cdName} onChange={setCdName} required
          placeholder={dirKind === "module" ? "Введение" : "Урок 1"} />
      </Modal>

      {/* Create step */}
      <Modal open={showCreateStep} title="Добавить шаг"
        onClose={() => { setShowCreateStep(false); setCsIsTest(false); }}
        footer={
          <>
            <button onClick={() => { setShowCreateStep(false); setCsIsTest(false); }} disabled={csLoading}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition disabled:opacity-50">Отмена</button>
            <button onClick={handleCreateStep} disabled={csLoading}
              className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50">
              {csLoading ? "Создание..." : "Создать шаг"}
            </button>
          </>
        }>
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Выберите тип нового шага:</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setCsIsTest(false)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                !csIsTest ? "border-primary bg-blue-50 text-primary" : "border-gray-200 text-text-muted hover:border-gray-300"
              }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium">Теория</span>
            </button>
            <button onClick={() => setCsIsTest(true)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                csIsTest ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-text-muted hover:border-gray-300"
              }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium">Тест</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Rename */}
      <Modal open={!!renameTarget} title="Переименовать" onClose={() => setRenameTarget(null)}
        footer={
          <>
            <button onClick={() => setRenameTarget(null)} disabled={rnLoading}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition disabled:opacity-50">Отмена</button>
            <button onClick={handleRename} disabled={rnLoading}
              className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50">
              {rnLoading ? "Сохранение..." : "Переименовать"}
            </button>
          </>
        }>
        <Field label="Новое имя" id="rn-name" value={rnName} onChange={setRnName} required />
      </Modal>

      {/* Delete step/dir confirm */}
      <ConfirmDialog
        open={!!confirmItem}
        message={deleteMessage}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmItem(null)}
        loading={deleteLoading}
      />

      {/* Delete image confirm */}
      <ConfirmDialog
        open={!!confirmImage}
        message={`Удалить изображение «${confirmImage?.name}»? Это действие необратимо.`}
        onConfirm={handleDeleteImage}
        onCancel={() => setConfirmImage(null)}
        loading={deletingImage}
      />
    </div>
  );
}
