import { timingSafeEqual, createHash } from "crypto";
import { Request } from "express";

export const MCP_SECRET_MIN_LENGTH = 32;

export const MCP_ADMIN = {
  userId: "mcp",
  username: "mcp",
  role: "admin",
} as const;

export function getMcpSecret(): string | undefined {
  const secret = process.env.MCP_SECRET?.trim();
  if (!secret || secret.length < MCP_SECRET_MIN_LENGTH) {
    return undefined;
  }
  return secret;
}

export function isMcpEnabled(): boolean {
  return Boolean(getMcpSecret());
}

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

/**
 * Compare secrets in constant time by hashing first so lengths cannot leak
 * via early return from timingSafeEqual.
 */
export function secretsEqual(provided: string, expected: string): boolean {
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}
