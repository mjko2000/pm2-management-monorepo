import { Controller, Get, Delete, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Log } from "../schemas/log.schema";
import { CustomLogger } from "./logger.service";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("logs")
export class LoggerController {
  constructor(
    @InjectModel(Log.name) private logModel: Model<Log>,
    private readonly logger: CustomLogger
  ) {
    this.logger.setContext("LoggerController");
  }

  @Get()
  async getLogs(
    @Query("limit") limit: string = "10",
    @Query("skip") skip: string = "0",
    @Query("level") level?: string,
    @Query("context") context?: string
  ) {
    try {
      const query: any = {};
      if (level) query.level = level;
      if (context) query.context = context;

      const [logs, total] = await Promise.all([
        this.logModel
          .find(query)
          .sort({ timestamp: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .exec(),
        this.logModel.countDocuments(query),
      ]);

      return { logs, total };
    } catch (error) {
      this.logger.error("Failed to fetch logs", error.stack);
      throw error;
    }
  }

  @Delete()
  async clearLogs() {
    try {
      await this.logModel.deleteMany({});
      this.logger.log("All logs cleared");
      return { message: "Logs cleared successfully" };
    } catch (error) {
      this.logger.error("Failed to clear logs", error.stack);
      throw error;
    }
  }
}
