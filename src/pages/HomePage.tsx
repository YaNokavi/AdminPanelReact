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
import type { StepEditorState, HomeReturnState, StepItem } from "./StepEditorPage";

export interface BreadcrumbItem {
  label: string;
  items: NavItem[];
  kind: ItemKind;
  path: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────────────

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

// ── field component ───────────────────────────────────────────────────────────────────

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

// ── main component ─────────────────────────────────────────────────────────────────────────

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

  // ── images state ──────────────────────────────────────────────────────────────
  const [submoduleImages, setSubmoduleImages] = useState<ImageFile[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [confirmImage, setConfirmImage] = useState<ImageFile | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);

  const isAtSubmodule = currentLevel === "step";

  const loadSubmoduleImages = useCallback(async (path: string) => {
    setImagesLoading(true);
    try {
      const folders = await fetchFolderImages(path);
      const images = folders
        .flatMap((f) => f.images ?? [])
        .filter((img) => img.name !== ".gitkeep");
      setSubmoduleImages(images);
    } catch {
      setSubmoduleImages([]);
    } finally {
      setImagesLoading(false);
    }
  }, []);

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

  // ── load courses ──────────────────────────────────────────────────────────────
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

  // ── navigation ──────────────────────────────────────────────────────────────
  const navigateTo = (item: NavItem) => {
    if (item.kind === "step") {
      // Собираем весь список шагов текущего подмодуля
      const allSteps: StepItem[] = currentCrumb.items
        .filter((i) => i.kind === "step")
        .map((i) => ({
          id: i.id as number,
          number: i.number ?? (i.id as number),
          isTest: i.isTest ?? false,
          contentUrl: i.contentUrl ?? "",
        }));
      const currentIndex = allSteps.findIndex((s) => s.id === (item.id as number));

      const editorState: StepEditorState = {
        stepId: item.id as number,
        stepNumber: item.number ?? (item.id as number),
        isTest: item.isTest ?? false,
        contentUrl: item.contentUrl ?? "",
        submodulePath: buildPath(breadcrumbs),
        steps: allSteps,
        currentIndex: currentIndex >= 0 ? currentIndex : 0,
      };
      navigate("/step-editor", { state: editorState });
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

  // ── delete ──────────────────────────────────────────────────────────────
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

  // ── create course modal ───────────────────────────────────────────────────────────────
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

  // ── edit course modal ────────────────────────────────────────────────────────────────
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

  // ── create directory modal ───────────────────────────────────────────────────────────────
  const [showCreateDir, setShowCreateDir] = useState(false);
  const [cdName, setCdName] = useState("");
  const [cdLoading, setCdLoading] = useState(false);

  const handleCreateDir = async () => {
    if (!cdName.trim()) { toast.error("Введите название"); return; }
    setCdLoading(true);
    try {
      const currentPath = buildPath(breadcrumbs);
      const type = currentLevel === "module" ? "module" : "submodule";
      await createDirectory({ name: cdName, path: currentPath, type, message: `Create ${type} ${cdName} via admin panel` });
      toast.success("Создано");
      setShowCreateDir(false); setCdName("");
      loadCourses();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка создания");
    } finally { setCdLoading(false); }
  };

  // ── create step ──────────────────────────────────────────────────────────────────
  const [csLoading, setCsLoading] = useState(false);

  const handleCreateStep = async (isTest: boolean) => {
    setCsLoading(true);
    try {
      const submodulePath = buildPath(breadcrumbs);
      const content = isTest
        ? JSON.stringify({ question: "", options: ["", "", "", ""], answer: [] }, null, 2)
        : "<p></p>";
      const res = await createFile({
        path: submodulePath,
        content,
        message: `Create step via admin panel`,
        image: false,
        is_test: isTest,
      });
      toast.success("Шаг создан");
      loadCourses();

      // Сразу переходим в редактор нового шага
      const newStep: StepItem = {
        id: res.id,
        number: currentCrumb.items.filter((i) => i.kind === "step").length + 1,
        isTest,
        contentUrl: "",
      };
      const allSteps: StepItem[] = [
        ...currentCrumb.items.filter((i) => i.kind === "step").map((i) => ({
          id: i.id as number,
          number: i.number ?? (i.id as number),
          isTest: i.isTest ?? false,
          contentUrl: i.contentUrl ?? "",
        })),
        newStep,
      ];
      const editorState: StepEditorState = {
        stepId: newStep.id,
        stepNumber: newStep.number,
        isTest,
        contentUrl: "",
        submodulePath,
        steps: allSteps,
        currentIndex: allSteps.length - 1,
      };
      navigate("/step-editor", { state: editorState });
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка создания шага");
    } finally { setCsLoading(false); }
  };

  // ── rename ────────────────────────────────────────────────────────────────────
  const [renameTarget, setRenameTarget] = useState<NavItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    setRenameLoading(true);
    try {
      const currentPath = buildPath(breadcrumbs);
      const itemPath = currentPath ? `${currentPath}/${renameTarget.id}` : String(renameTarget.id);
      await renameItem({ path: itemPath, fileTypeName: renameTarget.kind, newName: renameValue });
      toast.success("Переименовано");
      setRenameTarget(null); setRenameValue("");
      loadCourses();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка переименования");
    } finally { setRenameLoading(false); }
  };

  // ── image upload ───────────────────────────────────────────────────────────────
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Только изображения"); return; }
    setImageUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      const path = `${buildPath(breadcrumbs)}/images/${file.name}`;
      try {
        await createImage({ path, content: base64, message: `Upload image ${file.name} via admin panel` });
        toast.success("Изображение загружено");
        loadSubmoduleImages(buildPath(breadcrumbs));
      } catch (e: unknown) {
        toast.error((e as Error).message ?? "Ошибка загрузки");
      } finally {
        setImageUploadLoading(false);
        if (imageUploadRef.current) imageUploadRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  };

  // ── generate migration ───────────────────────────────────────────────────────────
  const handleGenerateMigration = async () => {
    try {
      const blob = await generateMigration();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "migration.sql";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("Миграция скачана");
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Ошибка генерации");
    }
  };

  // ── render ────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <ToastContainer toasts={toast.toasts} />

      {/* Шапка с breadcrumbs */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-2 flex-wrap flex-shrink-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-text-muted">/</span>}
            <button
              onClick={() => navigateToCrumb(i)}
              className={`text-sm transition ${
                i === breadcrumbs.length - 1
                  ? "text-text-heading font-semibold cursor-default"
                  : "text-primary hover:underline"
              }`}
            >
              {crumb.label}
            </button>
          </span>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleGenerateMigration}
            className="text-xs text-text-muted hover:text-primary transition px-2 py-1 rounded hover:bg-blue-50"
            title="Скачать SQL-миграцию"
          >
            ↓ migration.sql
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Заголовок + кнопки действий */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-heading">
            {currentCrumb.label}
          </h2>
          <div className="flex gap-2">
            {isRoot && (
              <button
                onClick={() => setShowCreateCourse(true)}
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
              >
                + Курс
              </button>
            )}
            {currentLevel === "module" && (
              <button
                onClick={() => setShowCreateDir(true)}
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
              >
                + Модуль
              </button>
            )}
            {currentLevel === "submodule" && (
              <button
                onClick={() => setShowCreateDir(true)}
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
              >
                + Подмодуль
              </button>
            )}
            {currentLevel === "step" && (
              <>
                <button
                  onClick={() => handleCreateStep(false)}
                  disabled={csLoading}
                  className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
                >
                  + Теория
                </button>
                <button
                  onClick={() => handleCreateStep(true)}
                  disabled={csLoading}
                  className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
                >
                  + Тест
                </button>
              </>
            )}
          </div>
        </div>

        {/* Список элементов */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-text-muted">
            <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Загрузка...
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center text-text-muted py-16">Пусто</div>
        ) : (
          <div className="grid gap-2">
            {currentItems.map((item) => (
              <FileItem
                key={item.id}
                item={item}
                onOpen={navigateTo}
                onDelete={setConfirmItem}
                onEdit={item.kind === "course" ? openEditCourse : undefined}
                onRename={item.kind !== "course" ? (i) => { setRenameTarget(i); setRenameValue(i.name); } : undefined}
              />
            ))}
          </div>
        )}

        {/* Изображения подмодуля */}
        {isAtSubmodule && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-heading">Изображения подмодуля</h3>
              <label
                className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input ref={imageUploadRef} type="file" accept="image/*" className="hidden" onChange={handleImageUploadChange} />
                {imageUploadLoading ? "Загрузка..." : dragOver ? "Отпустите" : "↑ Загрузить"}
              </label>
            </div>
            {imagesLoading ? (
              <div className="text-xs text-text-muted">Загрузка изображений...</div>
            ) : submoduleImages.length === 0 ? (
              <div className="text-xs text-text-muted">Нет изображений</div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {submoduleImages.map((img) => (
                  <div key={img.path} className="relative group">
                    <img
                      src={img.content_url}
                      alt={img.name}
                      className="w-24 h-24 object-cover rounded-lg border border-border"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-1">
                      <button
                        onClick={() => navigator.clipboard.writeText(img.content_url).then(() => toast.success("Ссылка скопирована"))}
                        className="p-1 bg-white/90 rounded text-xs text-gray-700 hover:bg-white transition"
                        title="Скопировать URL"
                      >
                        🔗
                      </button>
                      <button
                        onClick={() => setConfirmImage(img)}
                        className="p-1 bg-white/90 rounded text-xs text-red-600 hover:bg-white transition"
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-text-muted mt-1 truncate max-w-[96px]">{img.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <Modal open={showCreateCourse} title="Создать курс" onClose={() => setShowCreateCourse(false)}
        footer={
          <button onClick={handleCreateCourse} disabled={ccLoading}
            className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            {ccLoading ? "Создание..." : "Создать"}
          </button>
        }>
        <div className="space-y-3">
          <Field label="Название" id="cc-name" value={ccName} onChange={setCcName} required placeholder="Название курса" />
          <Field label="Автор" id="cc-author" value={ccAuthor} onChange={setCcAuthor} required placeholder="Имя автора" />
          <Field label="Описание" id="cc-desc" value={ccDesc} onChange={setCcDesc} required placeholder="О чём курс" textarea />
          <Field label="Иконка (URL)" id="cc-icon" value={ccIcon} onChange={setCcIcon} placeholder="https://..." />
          <Field label="Рейтинг" id="cc-rating" value={ccRating} onChange={setCcRating} type="number" min={0} max={5} />
        </div>
      </Modal>

      <Modal open={!!editTarget} title="Редактировать курс" onClose={() => setEditTarget(null)}
        footer={
          <button onClick={handleEditCourse} disabled={ecLoading}
            className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            {ecLoading ? "Сохранение..." : "Сохранить"}
          </button>
        }>
        <div className="space-y-3">
          <Field label="Название" id="ec-name" value={ecName} onChange={setEcName} required />
          <Field label="Автор" id="ec-author" value={ecAuthor} onChange={setEcAuthor} required />
          <Field label="Описание" id="ec-desc" value={ecDesc} onChange={setEcDesc} required textarea />
          <Field label="Иконка (URL)" id="ec-icon" value={ecIcon} onChange={setEcIcon} />
          <Field label="Рейтинг" id="ec-rating" value={ecRating} onChange={setEcRating} type="number" min={0} max={5} />
        </div>
      </Modal>

      <Modal
        open={showCreateDir}
        title={currentLevel === "module" ? "Создать модуль" : "Создать подмодуль"}
        onClose={() => { setShowCreateDir(false); setCdName(""); }}
        footer={
          <button onClick={handleCreateDir} disabled={cdLoading}
            className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            {cdLoading ? "Создание..." : "Создать"}
          </button>
        }>
        <Field
          label={currentLevel === "module" ? "Название модуля" : "Название подмодуля"}
          id="cd-name" value={cdName} onChange={setCdName} required
          placeholder={currentLevel === "module" ? "Название модуля" : "Название подмодуля"}
        />
      </Modal>

      <Modal open={!!renameTarget} title="Переименовать" onClose={() => { setRenameTarget(null); setRenameValue(""); }}
        footer={
          <button onClick={handleRename} disabled={renameLoading}
            className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            {renameLoading ? "Сохранение..." : "Сохранить"}
          </button>
        }>
        <Field label="Новое название" id="rename-val" value={renameValue} onChange={setRenameValue} required />
      </Modal>

      <ConfirmDialog
        open={!!confirmItem}
        message={deleteMessage}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmItem(null)}
        loading={deleteLoading}
      />

      <ConfirmDialog
        open={!!confirmImage}
        message={`Удалить изображение «${confirmImage?.name}»?`}
        onConfirm={handleDeleteImage}
        onCancel={() => setConfirmImage(null)}
        loading={deletingImage}
      />
    </div>
  );
}
