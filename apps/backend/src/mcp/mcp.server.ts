import { Injectable } from "@nestjs/common";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpToolsService } from "./mcp.tools";

const serviceRef = z
  .string()
  .min(1)
  .max(128)
  .describe("Service MongoDB id or name");

function asText(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function asError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

type ToolResult = ReturnType<typeof asText> | ReturnType<typeof asError>;

/**
 * The SDK's dual Zod 3/4 generics can fail TS2589 ("excessively deep").
 * Register through this helper so schemas stay runtime-validated without
 * exploding the type checker.
 */
function addTool(
  server: McpServer,
  name: string,
  description: string,
  handler: () => Promise<ToolResult>,
): void;
function addTool(
  server: McpServer,
  name: string,
  description: string,
  schema: Record<string, z.ZodTypeAny>,
  handler: (args: Record<string, any>) => Promise<ToolResult>,
): void;
function addTool(
  server: McpServer,
  name: string,
  description: string,
  schemaOrHandler:
    | Record<string, z.ZodTypeAny>
    | (() => Promise<ToolResult>),
  handler?: (args: Record<string, any>) => Promise<ToolResult>,
): void {
  if (typeof schemaOrHandler === "function") {
    server.tool(name, description, schemaOrHandler);
    return;
  }
  server.tool(name, description, schemaOrHandler as never, handler as never);
}

@Injectable()
export class McpServerFactory {
  constructor(private readonly tools: McpToolsService) {}

  create(): McpServer {
    const server = new McpServer({
      name: "pm2-dashboard",
      version: "1.0.0",
      description:
        "Manage PM2 Dashboard services. Identify a service by MongoDB id or name. " +
        "start_service and reload_service can take several minutes (install + build). " +
        "Environment variable values, GitHub tokens, and deploy keys are never returned.",
    });

    this.registerTools(server);
    return server;
  }

  private registerTools(server: McpServer): void {
    const tools = this.tools;

    addTool(
      server,
      "list_services",
      "List all PM2 Dashboard services (id, name, status, branch, repo, env names). Does not include secrets.",
      async () => {
        try {
          return asText(await tools.listServices());
        } catch (error) {
          return asError(error);
        }
      },
    );

    addTool(
      server,
      "get_service",
      "Get details for one service by id or name. Environment variable values are omitted.",
      { service: serviceRef },
      async ({ service }) => {
        try {
          return asText(await tools.getService(service));
        } catch (error) {
          return asError(error);
        }
      },
    );

    addTool(
      server,
      "start_service",
      "Deploy and start a service (clone/pull, install, build, then PM2 start). Can take 15-20 minutes.",
      { service: serviceRef },
      async ({ service }) => {
        try {
          return asText(await tools.startService(service));
        } catch (error) {
          return asError(error);
        }
      },
    );

    addTool(
      server,
      "stop_service",
      "Stop a running PM2 service.",
      { service: serviceRef },
      async ({ service }) => {
        try {
          return asText(await tools.stopService(service));
        } catch (error) {
          return asError(error);
        }
      },
    );

    addTool(
      server,
      "restart_service",
      "Restart a running PM2 service without pulling new code.",
      { service: serviceRef },
      async ({ service }) => {
        try {
          return asText(await tools.restartService(service));
        } catch (error) {
          return asError(error);
        }
      },
    );

    addTool(
      server,
      "reload_service",
      "Pull latest code, install/build, and reload the service (zero-downtime when possible). Can take 15-20 minutes.",
      { service: serviceRef },
      async ({ service }) => {
        try {
          return asText(await tools.reloadService(service));
        } catch (error) {
          return asError(error);
        }
      },
    );

    addTool(
      server,
      "get_service_logs",
      "Read recent PM2 stdout/stderr for a service. lines is clamped to 1-5000 (default 100).",
      {
        service: serviceRef,
        lines: z
          .number()
          .int()
          .min(1)
          .max(5000)
          .optional()
          .describe("Number of log lines to return (1-5000, default 100)"),
      },
      async ({ service, lines }) => {
        try {
          return asText(await tools.getServiceLogs(service, lines));
        } catch (error) {
          return asError(error);
        }
      },
    );

    addTool(
      server,
      "get_dashboard_logs",
      "Read PM2 Dashboard application logs stored in MongoDB (install/build output, errors).",
      {
        limit: z.number().int().min(1).max(200).optional(),
        skip: z.number().int().min(0).optional(),
        level: z.enum(["info", "warn", "error", "debug", "verbose"]).optional(),
        context: z.string().max(128).optional(),
      },
      async ({ limit, skip, level, context }) => {
        try {
          return asText(
            await tools.getDashboardLogs({ limit, skip, level, context }),
          );
        } catch (error) {
          return asError(error);
        }
      },
    );

    addTool(
      server,
      "get_service_metrics",
      "CPU, memory, uptime, restarts, and per-process details for a running service.",
      { service: serviceRef },
      async ({ service }) => {
        try {
          return asText(await tools.getServiceMetrics(service));
        } catch (error) {
          return asError(error);
        }
      },
    );

    addTool(
      server,
      "get_system_metrics",
      "Host CPU and memory metrics for the VPS.",
      async () => {
        try {
          return asText(await tools.getSystemMetrics());
        } catch (error) {
          return asError(error);
        }
      },
    );
  }
}
