import { Module } from "@nestjs/common";
import { GitHubService } from "./github.service";
import { GitHubController } from "./github.controller";
import { ConfigModule } from "../config/config.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  SystemConfig,
  SystemConfigSchema,
} from "@/schemas/system-config.schema";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
  ],
  controllers: [GitHubController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
