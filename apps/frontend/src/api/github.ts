import { Repository } from "@pm2-dashboard/shared";
import { apiGet, apiPost } from "./client";

export async function getRepositories(): Promise<Repository[]> {
  return apiGet<Repository[]>("/github/repositories");
}

export async function getBranches(repoUrl: string): Promise<string[]> {
  return apiGet<string[]>(
    `/github/branches?repoUrl=${encodeURIComponent(repoUrl)}`
  );
}

export async function setGitHubToken(
  token: string,
  username?: string
): Promise<void> {
  return apiPost("/github/token", { token, username });
}

export async function validateGitHubToken(): Promise<boolean> {
  try {
    return await apiGet<boolean>("/github/token/validate");
  } catch {
    return false;
  }
}
