import { Injectable } from "@nestjs/common";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpToolsService } from "./mcp.tools";
import { McpPermission } from "./mcp.permissions";

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

  create(permissions: readonly McpPermission[]): McpServer {
    const allowed = new Set(permissions);
    const server = new McpServer({
      name: "pm2-dashboard",
      version: "1.0.0",
      description:
        "Manage PM2 Dashboard services. Identify a service by MongoDB id or name. " +
        "start_service and reload_service can take several minutes (install + build). " +
        "Environment variable values, GitHub tokens, and deploy keys are never returned.",
    });

    this.registerTools(server, allowed);
    return server;
  }

  private registerTools(
    server: McpServer,
    allowed: Set<McpPermission>,
  ): void {
    const tools = this.tools;

    const register = (
      name: McpPermission,
      description: string,
      schema: Record<string, z.ZodTypeAny> | undefined,
      run: (args: Record<string, any>) => Promise<unknown>,
    ) => {
      if (!allowed.has(name)) {
        return;
      }

      const handler = async (args: Record<string, any> = {}) => {
        if (!allowed.has(name)) {
          return asError(new Error(`Permission denied: ${name}`));
        }
        try {
          return asText(await run(args));
        } catch (error) {
          return asError(error);
        }
      };

      if (schema) {
        addTool(server, name, description, schema, handler);
      } else {
        addTool(server, name, description, () => handler({}));
      }
    };

    register(
      "list_services",
      "List all PM2 Dashboard services (id, name, status, branch, repo, env names). Does not include secrets.",
      undefined,
      () => tools.listServices(),
    );

    register(
      "get_service",
      "Get details for one service by id or name. Environment variable values are omitted.",
      { service: serviceRef },
      ({ service }) => tools.getService(service),
    );

    register(
      "start_service",
      "Deploy and start a service (clone/pull, install, build, then PM2 start). Can take 15-20 minutes.",
      { service: serviceRef },
      ({ service }) => tools.startService(service),
    );

    register(
      "stop_service",
      "Stop a running PM2 service.",
      { service: serviceRef },
      ({ service }) => tools.stopService(service),
    );

    register(
      "restart_service",
      "Restart a running PM2 service without pulling new code.",
      { service: serviceRef },
      ({ service }) => tools.restartService(service),
    );

    register(
      "reload_service",
      "Pull latest code, install/build, and reload the service (zero-downtime when possible). Can take 15-20 minutes.",
      { service: serviceRef },
      ({ service }) => tools.reloadService(service),
    );

    register(
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
      ({ service, lines }) => tools.getServiceLogs(service, lines),
    );

    register(
      "get_dashboard_logs",
      "Read PM2 Dashboard application logs stored in MongoDB (install/build output, errors).",
      {
        limit: z.number().int().min(1).max(200).optional(),
        skip: z.number().int().min(0).optional(),
        level: z.enum(["info", "warn", "error", "debug", "verbose"]).optional(),
        context: z.string().max(128).optional(),
      },
      ({ limit, skip, level, context }) =>
        tools.getDashboardLogs({ limit, skip, level, context }),
    );

    register(
      "get_service_metrics",
      "CPU, memory, uptime, restarts, and per-process details for a running service.",
      { service: serviceRef },
      ({ service }) => tools.getServiceMetrics(service),
    );

    register(
      "get_system_metrics",
      "Host CPU and memory metrics for the VPS.",
      undefined,
      () => tools.getSystemMetrics(),
    );
  }
}
