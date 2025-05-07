import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CustomLogger } from "./logger.service";
import { LoggerController } from "./logger.controller";
import { Log, LogSchema } from "../schemas/log.schema";

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }])],
  controllers: [LoggerController],
  providers: [CustomLogger],
  exports: [CustomLogger],
})
export class LoggerModule {}
