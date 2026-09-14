import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export const MCP_PERMISSIONS = [
  "list_services",
  "get_service",
  "list_github_tokens",
  "list_github_repositories",
  "list_github_branches",
  "create_service",
  "start_service",
  "stop_service",
  "restart_service",
  "reload_service",
  "get_service_logs",
  "get_dashboard_logs",
  "get_service_metrics",
  "get_system_metrics",
] as const;

export type McpPermission = (typeof MCP_PERMISSIONS)[number];

export const MCP_PERMISSION_LABELS: Record<McpPermission, string> = {
  list_services: "List services",
  get_service: "View service details",
  list_github_tokens: "List GitHub tokens",
  list_github_repositories: "List GitHub repositories",
  list_github_branches: "List GitHub branches",
  create_service: "Create service",
  start_service: "Start",
  stop_service: "Stop",
  restart_service: "Restart",
  reload_service: "Reload",
  get_service_logs: "Service logs",
  get_dashboard_logs: "Dashboard logs",
  get_service_metrics: "Service metrics",
  get_system_metrics: "System metrics",
};

export const MCP_PERMISSION_GROUPS: { label: string; permissions: McpPermission[] }[] =
  [
    { label: "Read", permissions: ["list_services", "get_service"] },
    {
      label: "GitHub",
      permissions: [
        "list_github_tokens",
        "list_github_repositories",
        "list_github_branches",
      ],
    },
    {
      label: "Lifecycle",
      permissions: [
        "create_service",
        "start_service",
        "stop_service",
        "restart_service",
        "reload_service",
      ],
    },
    { label: "Logs", permissions: ["get_service_logs", "get_dashboard_logs"] },
    {
      label: "Metrics",
      permissions: ["get_service_metrics", "get_system_metrics"],
    },
  ];

export interface McpToken {
  _id: string;
  name: string;
  tokenPrefix: string;
  permissions: McpPermission[];
  isActive: boolean;
  lastUsedAt?: string;
  createdBy?: { _id: string; username: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface McpTokenCreated extends McpToken {
  token: string;
}

export interface CreateMcpTokenDto {
  name: string;
  permissions: McpPermission[];
}

export interface UpdateMcpTokenDto {
  name?: string;
  permissions?: McpPermission[];
  isActive?: boolean;
}

export function getMcpTokens(): Promise<McpToken[]> {
  return apiGet<McpToken[]>("/mcp/tokens");
}

export function createMcpToken(
  data: CreateMcpTokenDto,
): Promise<McpTokenCreated> {
  return apiPost<McpTokenCreated>("/mcp/tokens", data);
}

export function updateMcpToken(
  id: string,
  data: UpdateMcpTokenDto,
): Promise<McpToken> {
  return apiPut<McpToken>(`/mcp/tokens/${id}`, data);
}

export function deleteMcpToken(id: string): Promise<void> {
  return apiDelete(`/mcp/tokens/${id}`);
}

export function regenerateMcpToken(id: string): Promise<McpTokenCreated> {
  return apiPost<McpTokenCreated>(`/mcp/tokens/${id}/regenerate`);
}
