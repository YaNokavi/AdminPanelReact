import { apiFetch } from "./client";

export interface LoginResponse {
  success: boolean;
  message: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/login", {
    method: "POST",
    body: { username, password },
  });
}
