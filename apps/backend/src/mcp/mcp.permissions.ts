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

export function isMcpPermission(value: string): value is McpPermission {
  return (MCP_PERMISSIONS as readonly string[]).includes(value);
}
