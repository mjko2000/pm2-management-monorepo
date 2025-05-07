import { Log } from "@pm2-dashboard/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface GetLogsResponse {
  logs: Log[];
  total: number;
}

export const getLogs = async (
  limit: number,
  skip: number,
  level?: string,
  context?: string
): Promise<GetLogsResponse> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
  });

  if (level) params.append("level", level);
  if (context) params.append("context", context);

  const response = await fetch(`${API_URL}/logs?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch logs");
  }
  return response.json();
};

export const clearLogs = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/logs`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to clear logs");
  }
};
