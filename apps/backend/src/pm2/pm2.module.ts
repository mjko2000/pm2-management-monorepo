import { Module, forwardRef } from "@nestjs/common";
import { PM2Service } from "./pm2.service";
import { PM2Controller } from "./pm2.controller";
import { ConfigModule } from "../config/config.module";
import { GitHubModule } from "../github/github.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  SystemConfig,
  SystemConfigSchema,
} from "@/schemas/system-config.schema";
import { Service, ServiceSchema } from "@/schemas/service.schema";
import { DomainModule } from "../domain/domain.module";

@Module({
  imports: [
    ConfigModule,
    GitHubModule,
    forwardRef(() => DomainModule),
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [PM2Controller],
  providers: [PM2Service],
  exports: [PM2Service],
})
export class PM2Module {}
