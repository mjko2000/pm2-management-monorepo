import { Log } from "@pm2-dashboard/shared";
import { apiGet, apiDelete } from "./client";

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

  return apiGet<GetLogsResponse>(`/logs?${params.toString()}`);
};

export const clearLogs = async (): Promise<void> => {
  return apiDelete("/logs");
};
