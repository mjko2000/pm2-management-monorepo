import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GitHubModule } from "../github/github.module";
import { PM2Module } from "../pm2/pm2.module";
import { Log, LogSchema } from "../schemas/log.schema";
import { Service, ServiceSchema } from "../schemas/service.schema";
import { McpToken, McpTokenSchema } from "../schemas/mcp-token.schema";
import {
  GithubToken,
  GithubTokenSchema,
} from "../schemas/github-token.schema";
import { McpAuthGuard } from "./mcp.auth.guard";
import { McpController } from "./mcp.controller";
import { McpServerFactory } from "./mcp.server";
import { McpTokenController } from "./mcp.token.controller";
import { McpTokenService } from "./mcp.token.service";
import { McpToolsService } from "./mcp.tools";

@Module({
  imports: [
    PM2Module,
    GitHubModule,
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: McpToken.name, schema: McpTokenSchema },
      { name: GithubToken.name, schema: GithubTokenSchema },
    ]),
  ],
  controllers: [McpController, McpTokenController],
  providers: [McpAuthGuard, McpTokenService, McpToolsService, McpServerFactory],
})
export class McpModule implements OnModuleInit {
  private readonly logger = new Logger(McpModule.name);

  onModuleInit() {
    this.logger.log(
      "MCP protocol at /mcp (Streamable HTTP) and /sse (legacy). Create bot tokens in the Dashboard.",
    );
  }
}
