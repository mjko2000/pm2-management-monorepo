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

  /**
   * Normalize a `trace`-like argument so callers can pass an Error object,
   * a string, or anything else without losing the stack trace and without
   * having `[object Object]` written to the log store.
   */
  private normalizeTrace(trace?: unknown): string | undefined {
    if (trace === undefined || trace === null) return undefined;
    if (typeof trace === "string") return trace;
    if (trace instanceof Error) return trace.stack ?? trace.message;
    try {
      return JSON.stringify(trace);
    } catch {
      return String(trace);
    }
  }

  log(message: string, context?: string) {
    if (context) this.setContext(context);
    console.log(`[${this.context}] ${message}`);
    this.storeLog("info", message);
  }

  error(message: string, trace?: unknown, context?: string) {
    if (context) this.setContext(context);
    const traceStr = this.normalizeTrace(trace);
    console.error(`[${this.context}] ${message}`, traceStr ?? "");
    this.storeLog("error", message, traceStr);
  }

  warn(message: string, context?: string) {
    if (context) this.setContext(context);
    console.warn(`[${this.context}] ${message}`);
    this.storeLog("warn", message);
  }

  debug(message: string, context?: string) {
    if (context) this.setContext(context);
    console.debug(`[${this.context}] ${message}`);
    this.storeLog("debug", message);
  }

  verbose(message: string, context?: string) {
    if (context) this.setContext(context);
    console.log(`[${this.context}] ${message}`);
    this.storeLog("verbose", message);
  }
}
