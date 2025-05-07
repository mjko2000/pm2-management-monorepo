import { Module } from "@nestjs/common";
import { ConfigService } from "./config.service";
import {
  SystemConfig,
  SystemConfigSchema,
} from "@/schemas/system-config.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
