import { apiFetch } from "./client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Step {
  id: number;
  name: string;
  submodule_id: number;
  parent_id: number;
  content_url: string;
  is_test: boolean;
  number: number;
}

export interface Submodule {
  id: number;
  name: string;
  module_id: number;
  parent_id: number;
  type: "dir";
  steps: Step[] | null;
}

export interface CourseModule {
  id: number;
  name: string;
  course_id: number;
  parent_id: number;
  type: "dir";
  submodules: Submodule[] | null;
}

export interface Course {
  id: number;
  name: string;
  author: string;
  description: string;
  rating: number;
  icon: string;
  type: "dir";
  modules: CourseModule[] | null;
}

export type FileType = "Курсы" | "Модули" | "Сабмодули" | "Шаги";

export interface ImageFile {
  id: number;
  name: string;
  type: "image";
  path: string;
  content_url: string;
}

export interface FolderImages {
  id: number;
  name: string;
  type: "dir";
  path: string;
  images: ImageFile[];
}

export interface FileContent {
  type: "text" | "json" | "image";
  data: string | Record<string, unknown>;
}

export interface FileContentResponse {
  success: boolean;
  content: FileContent;
  sha: string;
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export async function fetchCourses(path = "", type: FileType = "Курсы"): Promise<Course[]> {
  return apiFetch<Course[]>(
    `/api/courses?path=${encodeURIComponent(path)}&type=${encodeURIComponent(type)}`,
  );
}

export async function fetchModules(path: string): Promise<CourseModule[]> {
  return apiFetch<CourseModule[]>(
    `/api/courses?path=${encodeURIComponent(path)}&type=${encodeURIComponent("Модули")}`,
  );
}

export async function fetchSubmodules(path: string): Promise<Submodule[]> {
  return apiFetch<Submodule[]>(
    `/api/courses?path=${encodeURIComponent(path)}&type=${encodeURIComponent("Сабмодули")}`,
  );
}

export async function fetchSteps(path: string): Promise<Step[]> {
  return apiFetch<Step[]>(
    `/api/courses?path=${encodeURIComponent(path)}&type=${encodeURIComponent("Шаги")}`,
  );
}

export async function fetchFolderImages(path: string): Promise<FolderImages[]> {
  return apiFetch<FolderImages[]>(
    `/api/folder-images?path=${encodeURIComponent(path)}`,
  );
}

export async function fetchFileContent(
  fileUrl: string,
  filePath: string,
  isTest: boolean,
): Promise<FileContentResponse> {
  return apiFetch<FileContentResponse>(
    `/api/file-content?fileUrl=${encodeURIComponent(fileUrl)}&filePath=${encodeURIComponent(filePath)}&fileType=${isTest}`,
    { noCache: true },
  );
}
