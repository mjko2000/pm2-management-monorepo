import { Module } from "@nestjs/common";
import { GitHubService } from "./github.service";
import { GithubTokenService } from "./github-token.service";
import { GitHubController } from "./github.controller";
import { ConfigModule } from "../config/config.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  SystemConfig,
  SystemConfigSchema,
} from "@/schemas/system-config.schema";
import {
  GithubToken,
  GithubTokenSchema,
} from "@/schemas/github-token.schema";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
      { name: GithubToken.name, schema: GithubTokenSchema },
    ]),
  ],
  controllers: [GitHubController],
  providers: [GitHubService, GithubTokenService],
  exports: [GitHubService, GithubTokenService],
})
export class GitHubModule {}
