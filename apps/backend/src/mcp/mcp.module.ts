import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PM2Module } from "../pm2/pm2.module";
import { Log, LogSchema } from "../schemas/log.schema";
import { Service, ServiceSchema } from "../schemas/service.schema";
import { McpAuthGuard } from "./mcp.auth.guard";
import { McpController } from "./mcp.controller";
import { McpServerFactory } from "./mcp.server";
import { McpToolsService } from "./mcp.tools";
import { isMcpEnabled, MCP_SECRET_MIN_LENGTH } from "./mcp.auth";

@Module({
  imports: [
    PM2Module,
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [McpController],
  providers: [McpAuthGuard, McpToolsService, McpServerFactory],
})
export class McpModule implements OnModuleInit {
  private readonly logger = new Logger(McpModule.name);

  onModuleInit() {
    if (isMcpEnabled()) {
      this.logger.log("MCP enabled at /mcp (Streamable HTTP) and /sse (legacy)");
      return;
    }

    this.logger.warn(
      `MCP disabled: set MCP_SECRET in the environment (min ${MCP_SECRET_MIN_LENGTH} characters) to expose /mcp`,
    );
  }
}
