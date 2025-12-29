import { apiGet, apiPost, apiPut, apiDelete } from "./client";

export interface GithubToken {
  _id: string;
  name: string;
  visibility: "private" | "public";
  createdBy: {
    _id: string;
    username: string;
  };
  isActive: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface CreateGithubTokenDto {
  name: string;
  token: string;
  visibility: "private" | "public";
}

export interface UpdateGithubTokenDto {
  name?: string;
  token?: string;
  visibility?: "private" | "public";
  isActive?: boolean;
}

export async function getGithubTokens(): Promise<GithubToken[]> {
  return apiGet<GithubToken[]>("/github/tokens");
}

export async function createGithubToken(
  data: CreateGithubTokenDto
): Promise<GithubToken> {
  return apiPost<GithubToken>("/github/tokens", data);
}

export async function updateGithubToken(
  id: string,
  data: UpdateGithubTokenDto
): Promise<GithubToken> {
  return apiPut<GithubToken>(`/github/tokens/${id}`, data);
}

export async function deleteGithubToken(id: string): Promise<void> {
  return apiDelete(`/github/tokens/${id}`);
}

export async function validateGithubToken(
  id: string
): Promise<{ valid: boolean }> {
  return apiPost<{ valid: boolean }>(`/github/tokens/${id}/validate`);
}
