import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Octokit } from "@octokit/rest";
import { ConfigService } from "../config/config.service";
import { Repository } from "@pm2-dashboard/shared";
import * as fs from "fs";
import * as path from "path";
import { SystemConfig } from "../schemas/system-config.schema";
import simpleGit, { SimpleGit } from "simple-git";

@Injectable()
export class GitHubService {
  private octokit: Octokit;
  private git: SimpleGit;

  constructor(
    private configService: ConfigService,
    @InjectModel(SystemConfig.name)
    private systemConfigModel: Model<SystemConfig>
  ) {
    this.initializeOctokit();
    this.git = simpleGit();
  }

  private async initializeOctokit(): Promise<void> {
    const config = await this.configService.getSystemConfig();
    if (config.github?.token) {
      this.octokit = new Octokit({
        auth: config.github.token,
      });
    }
  }

  async setToken(token: string): Promise<void> {
    const config =
      (await this.systemConfigModel.findOne().exec()) ||
      new this.systemConfigModel();
    config.github = { token };
    await config.save();
    console.log("set token", token);

    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getToken(): Promise<string | undefined> {
    const config = await this.configService.getSystemConfig();
    return config.github?.token;
  }

  async validateToken(): Promise<boolean> {
    if (!this.octokit) {
      return false;
    }

    try {
      await this.octokit.users.getAuthenticated();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRepositories(): Promise<Repository[]> {
    console.log("get repositories", this.octokit);
    if (!this.octokit) {
      throw new UnauthorizedException("GitHub token not configured");
    }

    try {
      const { data: repos } = await this.octokit.repos.listForAuthenticatedUser(
        {
          sort: "updated",
          direction: "desc",
          per_page: 100,
        }
      );

      return repos.map((repo) => ({
        id: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        description: repo.description || undefined,
      }));
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw new Error("Failed to fetch repositories from GitHub");
    }
  }

  async cloneRepository(repoUrl: string, branch: string): Promise<string> {
    if (!this.octokit) {
      throw new Error("GitHub token not configured");
    }

    const workingDir = await this.configService.getWorkingDirectory();
    const repoName = this.extractRepoName(repoUrl);
    const repoPath = path.join(workingDir, repoName);

    // Create working directory if it doesn't exist
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true });
    }

    const token = await this.getToken();
    if (!token) {
      throw new Error("GitHub token not configured");
    }

    // Clone or pull repository
    if (fs.existsSync(repoPath)) {
      // Repository exists, pull latest changes
      await this.git
        .cwd(repoPath)
        .fetch("origin")
        .reset(["--hard", `origin/${branch}`]);
    } else {
      // Clone new repository
      const cloneUrl = repoUrl.endsWith(".git") ? repoUrl : `${repoUrl}.git`;
      const authUrl = cloneUrl.replace("https://", `https://${token}@`);

      await this.git.clone(authUrl, repoPath, ["-b", branch]);
    }

    return repoPath;
  }

  private extractRepoName(repoUrl: string): string {
    // Extract repository name from URL
    const match = repoUrl.match(/github\.com\/[^/]+\/([^/]+)(?:\.git)?$/);
    if (!match) {
      throw new Error("Invalid repository URL");
    }
    return match[1];
  }

  async getBranches(repoUrl: string): Promise<string[]> {
    if (!this.octokit) {
      throw new UnauthorizedException("GitHub token not configured");
    }

    try {
      // Extract owner and repo from full GitHub URL
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error("Invalid GitHub repository URL");
      }

      const [, owner, repo] = match;
      const { data: branches } = await this.octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      });

      return branches.map((branch) => branch.name);
    } catch (error) {
      console.error("Error fetching branches:", error);
      throw new Error(`Failed to fetch branches for repository ${repoUrl}`);
    }
  }
}
