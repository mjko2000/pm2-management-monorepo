import { Repository } from "@pm2-dashboard/shared";
import { apiGet } from "./client";

export async function getRepositories(tokenId: string): Promise<Repository[]> {
  return apiGet<Repository[]>(`/github/repositories?tokenId=${tokenId}`);
}

export async function getBranches(
  repoUrl: string,
  tokenId: string
): Promise<string[]> {
  return apiGet<string[]>(
    `/github/branches?repoUrl=${encodeURIComponent(repoUrl)}&tokenId=${tokenId}`
  );
}
