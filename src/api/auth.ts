import { apiFetch } from "./client";

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  // Логин не использует apiFetch — токена ещё нет
  const BASE_URL = import.meta.env.VITE_API_URL ?? "https://admincuna-back-anderm.amvera.io";
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data: LoginResponse = await res.json();
  if (data.success && data.token) {
    sessionStorage.setItem("cunaedu_token", data.token);
  }
  return data;
}
