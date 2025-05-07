import { Repository } from "@pm2-dashboard/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function getRepositories(): Promise<Repository[]> {
  const response = await fetch(`${API_URL}/github/repositories`);

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  return response.json();
}

export async function getBranches(repoUrl: string): Promise<string[]> {
  const response = await fetch(
    `${API_URL}/github/branches?repoUrl=${encodeURIComponent(repoUrl)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch branches");
  }

  return response.json();
}

export async function setGitHubToken(
  token: string,
  username?: string
): Promise<void> {
  const response = await fetch(`${API_URL}/github/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, username }),
  });

  if (!response.ok) {
    throw new Error("Failed to set GitHub token");
  }
}

export async function validateGitHubToken(): Promise<boolean> {
  const response = await fetch(`${API_URL}/github/token/validate`);

  if (!response.ok) {
    return false;
  }

  return response.json();
}
