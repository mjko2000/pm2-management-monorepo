import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { WebhookController } from "./webhook.controller";
import { WebhookService } from "./webhook.service";
import { Service, ServiceSchema } from "../schemas/service.schema";
import { GitHubModule } from "../github/github.module";
import { PM2Module } from "../pm2/pm2.module";
import { LoggerModule } from "../logger/logger.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
    GitHubModule,
    forwardRef(() => PM2Module),
    LoggerModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}

