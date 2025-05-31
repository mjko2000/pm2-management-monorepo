import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as path from "path";
import { SystemConfig, GitHubConfig } from "@pm2-dashboard/shared";
import { SystemConfig as SystemConfigModel } from "../schemas/system-config.schema";
import * as fs from "fs";

@Injectable()
export class ConfigService {
  private config: SystemConfig;
  private defaultWorkingDirectory: string;

  constructor(
    private configService: NestConfigService,
    @InjectModel(SystemConfigModel.name)
    private systemConfigModel: Model<SystemConfigModel>
  ) {
    this.defaultWorkingDirectory =
      this.configService.get("WORKING_DIR") ||
      path.join(
        process.env.HOME || process.env.USERPROFILE || "",
        "repositories"
      );
    this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    try {
      let config = await this.systemConfigModel.findOne().exec();

      if (!config) {
        // Default config if not exists
        config = await this.systemConfigModel.create({
          workingDirectory: this.defaultWorkingDirectory,
          github: {
            token: this.configService.get("GITHUB_TOKEN"),
          },
        });
      }

      this.config = config.toObject();
    } catch (error) {
      console.error("Error loading config:", error);
      this.config = {
        workingDirectory: this.defaultWorkingDirectory,
      };
    }

    // Ensure working directory exists
    if (!fs.existsSync(this.config.workingDirectory)) {
      fs.mkdirSync(this.config.workingDirectory, { recursive: true });
    }
  }

  async getSystemConfig(): Promise<SystemConfigModel> {
    let config = await this.systemConfigModel.findOne().exec();
    if (!config) {
      config = await this.systemConfigModel.create({
        workingDirectory: this.defaultWorkingDirectory,
        github: {
          token: this.configService.get("GITHUB_TOKEN"),
        },
      });
    }
    return config;
  }

  async getGitHubConfig(): Promise<GitHubConfig | undefined> {
    const config = await this.getSystemConfig();
    return config.github;
  }

  async getWorkingDirectory(): Promise<string> {
    const config = await this.getSystemConfig();
    if (!fs.existsSync(config.workingDirectory)) {
      fs.mkdirSync(config.workingDirectory, { recursive: true });
    }
    return config.workingDirectory;
  }

  async setWorkingDirectory(directory: string): Promise<void> {
    const config = await this.getSystemConfig();
    config.workingDirectory = directory;
    await config.save();
  }

  async setGitHubToken(token: string): Promise<void> {
    const config = await this.getSystemConfig();
    config.github = { token };
    await config.save();
  }
}
