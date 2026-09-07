import { Request } from "express";
import { McpAuthContext } from "./mcp.token.service";

export const MCP_ADMIN = {
  userId: "mcp",
  username: "mcp",
  role: "admin",
} as const;

export function extractMcpSecret(req: Request): string | undefined {
  const authorization = req.headers.authorization;
  if (typeof authorization === "string") {
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  const header = req.headers["x-mcp-secret"];
  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }
  if (Array.isArray(header) && header[0]?.trim()) {
    return header[0].trim();
  }

  return undefined;
}

export function getRequestMcpAuth(req: Request): McpAuthContext | undefined {
  return (req as Request & { mcpAuth?: McpAuthContext }).mcpAuth;
}

export function setRequestMcpAuth(req: Request, auth: McpAuthContext): void {
  (req as Request & { mcpAuth?: McpAuthContext }).mcpAuth = auth;
}
