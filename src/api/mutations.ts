import { apiFetch } from "./client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UpdateFilePayload {
  path: string;
  content: string;
  message: string;
  sha: string;
}

export interface CreateFilePayload {
  path: string;
  content: string;
  message: string;
  image: boolean;
  is_test: boolean;
}

export interface CreateImagePayload {
  path: string;
  content: string; // base64
  message: string;
}

export interface DeleteFilePayload {
  stepId: number;
  path: string;
  message: string;
  sha: string;
}

export interface DeleteImagePayload {
  path: string;
  message: string;
  sha: string;
}

export interface CreateDirectoryPayload {
  path: string;
  type: "module" | "submodule";
  message: string;
}

export interface CreateCoursePayload {
  name: string;
  author: string;
  description: string;
  icon: string;
  message: string;
}

export interface EditCoursePayload {
  id: number;
  name: string;
  author: string;
  description: string;
  icon: string;
}

export interface RenamePayload {
  path: string;
  fileTypeName: "course" | "module" | "submodule";
  newName: string;
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export async function updateFile(payload: UpdateFilePayload) {
  return apiFetch<{ success: boolean; data: unknown }>("/api/update-file", {
    method: "PUT",
    body: payload,
  });
}

export async function createFile(payload: CreateFilePayload) {
  return apiFetch<{ id: number; message: string }>("/api/create-file", {
    method: "POST",
    body: payload,
  });
}

export async function createImage(payload: CreateImagePayload) {
  return apiFetch<{ message: string }>("/api/create-image", {
    method: "POST",
    body: payload,
  });
}

export async function deleteFile(payload: DeleteFilePayload) {
  return apiFetch<{ success: boolean; data: unknown }>("/api/delete-file", {
    method: "DELETE",
    body: payload,
  });
}

export async function deleteImage(payload: DeleteImagePayload) {
  return apiFetch<{ success: boolean; data: unknown }>("/api/delete-image", {
    method: "DELETE",
    body: payload,
  });
}

export async function editStep(stepId: number, isTest: boolean) {
  return apiFetch<{ success: boolean }>(
    `/api/edit-step?stepId=${stepId}&isTest=${isTest}`,
    { method: "POST" },
  );
}

export async function createDirectory(payload: CreateDirectoryPayload) {
  return apiFetch<{ id: number; message: string }>("/api/create-directory", {
    method: "POST",
    body: payload,
  });
}

export async function createCourse(payload: CreateCoursePayload) {
  return apiFetch<{ id: number; message: string }>("/api/create-course", {
    method: "POST",
    body: payload,
  });
}

export async function editCourse(payload: EditCoursePayload) {
  return apiFetch<{ message: string }>("/api/edit-course", {
    method: "POST",
    body: payload,
  });
}

export async function renameItem(payload: RenamePayload) {
  return apiFetch<{ success: boolean }>("/api/rename", {
    method: "PUT",
    body: payload,
  });
}

export async function generateMigration(): Promise<string> {
  const BASE_URL = import.meta.env.VITE_API_URL ?? "https://admincuna-back-anderm.amvera.io";
  const res = await fetch(`${BASE_URL}/api/generate-migration`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
