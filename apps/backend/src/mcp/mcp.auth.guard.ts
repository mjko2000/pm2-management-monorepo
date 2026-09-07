import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { extractMcpSecret, setRequestMcpAuth } from "./mcp.auth";
import { McpTokenService } from "./mcp.token.service";

@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(private readonly mcpTokenService: McpTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = extractMcpSecret(request);
    if (!provided) {
      throw new UnauthorizedException("Invalid MCP token");
    }

    const auth = await this.mcpTokenService.findActiveByPlaintext(provided);
    if (!auth) {
      throw new UnauthorizedException("Invalid MCP token");
    }

    setRequestMcpAuth(request, auth);
    void this.mcpTokenService.touchLastUsed(auth.id);
    return true;
  }
}
