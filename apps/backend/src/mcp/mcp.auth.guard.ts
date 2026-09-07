import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { extractMcpSecret, getMcpSecret, secretsEqual } from "./mcp.auth";

@Injectable()
export class McpAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = getMcpSecret();
    // Unconfigured MCP looks like an unknown route so the endpoint is not advertised.
    if (!expected) {
      throw new NotFoundException();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = extractMcpSecret(request);
    if (!provided || !secretsEqual(provided, expected)) {
      throw new UnauthorizedException("Invalid MCP secret");
    }

    return true;
  }
}
