import {
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Public } from "../auth/decorators/public.decorator";
import { McpAuthGuard } from "./mcp.auth.guard";
import { McpServerFactory } from "./mcp.server";

@Public()
@UseGuards(McpAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller()
export class McpController {
  private readonly sseSessions = new Map<
    string,
    { transport: SSEServerTransport; close: () => Promise<void> }
  >();

  constructor(private readonly serverFactory: McpServerFactory) {}

  @Post("mcp")
  async handleMcpPost(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.handleStreamable(req, res);
  }

  @Get("mcp")
  async handleMcpGet(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handleStreamable(req, res);
  }

  @Delete("mcp")
  async handleMcpDelete(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.handleStreamable(req, res);
  }

  @Get("sse")
  async handleSse(@Req() req: Request, @Res() res: Response): Promise<void> {
    const server = this.serverFactory.create();
    const transport = new SSEServerTransport("/messages", res);

    this.sseSessions.set(transport.sessionId, {
      transport,
      close: async () => {
        this.sseSessions.delete(transport.sessionId);
        await transport.close();
        await server.close();
      },
    });

    res.on("close", () => {
      const session = this.sseSessions.get(transport.sessionId);
      if (session) {
        void session.close();
      }
    });

    await server.connect(transport);
  }

  @Post("messages")
  async handleSseMessage(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const sessionId =
      typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
    const session = sessionId ? this.sseSessions.get(sessionId) : undefined;

    if (!session) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Unknown SSE session" },
        id: null,
      });
      return;
    }

    await session.transport.handlePostMessage(req, res, req.body);
  }

  private async handleStreamable(
    req: Request,
    res: Response,
  ): Promise<void> {
    const server = this.serverFactory.create();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal error" },
          id: null,
        });
      }
      void transport.close();
      void server.close();
    }
  }
}
