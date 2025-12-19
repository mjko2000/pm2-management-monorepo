import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { APP_GUARD } from "@nestjs/core";
import { GitHubModule } from "./github/github.module";
import { PM2Module } from "./pm2/pm2.module";
import { EnvironmentModule } from "./environment/environment.module";
import { ConfigService as AppConfigService } from "./config/config.service";
import { ConfigModule as AppConfigModule } from "./config/config.module";
import { Service, ServiceSchema } from "./schemas/service.schema";
import {
  SystemConfig,
  SystemConfigSchema,
} from "./schemas/system-config.schema";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PM2Service } from "./pm2/pm2.service";
import { GitHubService } from "./github/github.service";
import { LoggerModule } from "./logger/logger.module";
import { Log, LogSchema } from "./schemas/log.schema";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri:
          process.env.MONGODB_URI || "mongodb://localhost:27017/pm2-dashboard",
      }),
    }),
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: SystemConfig.name, schema: SystemConfigSchema },
      { name: Log.name, schema: LogSchema },
    ]),
    AppConfigModule,
    GitHubModule,
    PM2Module,
    EnvironmentModule,
    LoggerModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PM2Service,
    GitHubService,
    AppConfigService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
