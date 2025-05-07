import { Injectable, LoggerService, Scope } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Log } from "../schemas/log.schema";

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger implements LoggerService {
  private context?: string;

  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {}

  setContext(context: string) {
    this.context = context;
  }

  private async storeLog(level: string, message: string, trace?: string) {
    try {
      await this.logModel.create({
        level,
        message,
        context: this.context,
        timestamp: new Date(),
        trace,
      });
    } catch (error) {
      console.error("Failed to store log:", error);
    }
  }

  log(message: string, context?: string) {
    this.setContext(context);
    console.log(`[${this.context}] ${message}`);
    this.storeLog("info", message);
  }

  error(message: string, trace?: string, context?: string) {
    this.setContext(context);
    console.error(`[${this.context}] ${message}`, trace);
    this.storeLog("error", message, trace);
  }

  warn(message: string, context?: string) {
    this.setContext(context);
    console.warn(`[${this.context}] ${message}`);
    this.storeLog("warn", message);
  }

  debug(message: string, context?: string) {
    this.setContext(context);
    console.debug(`[${this.context}] ${message}`);
    this.storeLog("debug", message);
  }

  verbose(message: string, context?: string) {
    this.setContext(context);
    console.log(`[${this.context}] ${message}`);
    this.storeLog("verbose", message);
  }
}
