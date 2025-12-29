import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Octokit } from "@octokit/rest";
import { ConfigService } from "../config/config.service";
import { Repository } from "@pm2-dashboard/shared";
import * as fs from "fs";
import * as path from "path";
import simpleGit, { SimpleGit } from "simple-git";
import { GithubTokenService } from "./github-token.service";

@Injectable()
export class GitHubService {
  private git: SimpleGit;

  constructor(
    private configService: ConfigService,
    private githubTokenService: GithubTokenService
  ) {
    this.git = simpleGit();
  }

  private createOctokit(token: string): Octokit {
    return new Octokit({ auth: token });
  }

  async validateToken(tokenValue: string): Promise<boolean> {
    return this.githubTokenService.validateToken(tokenValue);
  }

  async getRepositories(
    tokenId: string,
    userId: string
  ): Promise<Repository[]> {
    const tokenValue = await this.githubTokenService.getTokenValue(
      tokenId,
      userId
    );
    const octokit = this.createOctokit(tokenValue);

    try {
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        direction: "desc",
        per_page: 100,
      });

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

  async cloneRepository(
    repoUrl: string,
    branch: string,
    tokenId: string,
    userId: string,
    serviceName?: string
  ): Promise<string> {
    const tokenValue = await this.githubTokenService.getTokenValue(
      tokenId,
      userId
    );

    const workingDir = await this.configService.getWorkingDirectory();
    const repoName = this.extractRepoName(repoUrl);
    const repoPathName = serviceName
      ? `${repoName}-${this.createSlug(serviceName)}`
      : repoName;
    const repoPath = path.join(workingDir, repoPathName);

    // Create working directory if it doesn't exist
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true });
    }

    // Check if repository already exists
    if (fs.existsSync(repoPath)) {
      // Repository exists, pull latest changes
      return this.pullRepository(repoPath, branch, tokenValue);
    } else {
      // Clone new repository
      const cloneUrl = repoUrl.endsWith(".git") ? repoUrl : `${repoUrl}.git`;
      const authUrl = cloneUrl.replace("https://", `https://${tokenValue}@`);

      await this.git.clone(authUrl, repoPath, ["-b", branch]);
      return repoPath;
    }
  }

  async pullRepository(
    repoPath: string,
    branch: string,
    tokenValue: string
  ): Promise<string> {
    if (!fs.existsSync(repoPath)) {
      throw new Error("Repository path does not exist");
    }

    await this.resetRemoteUrl(repoPath, tokenValue);

    // Pull latest changes
    await this.git
      .cwd(repoPath)
      .fetch("origin")
      .reset(["--hard", `origin/${branch}`]);

    return repoPath;
  }

  async pullRepositoryWithTokenId(
    repoPath: string,
    branch: string,
    tokenId: string,
    userId: string
  ): Promise<string> {
    const tokenValue = await this.githubTokenService.getTokenValue(
      tokenId,
      userId
    );
    return this.pullRepository(repoPath, branch, tokenValue);
  }

  private async resetRemoteUrl(
    repoPath: string,
    tokenValue: string
  ): Promise<void> {
    // Read the current remote URL
    const remotes = await this.git.cwd(repoPath).getRemotes(true);
    const originRemote = remotes.find((r) => r.name === "origin");
    if (!originRemote || !originRemote.refs.fetch) {
      throw new Error("Origin remote not found in repository");
    }

    // Build authenticated remote URL
    let remoteUrl = originRemote.refs.fetch;
    if (remoteUrl.startsWith("https://")) {
      // Remove any existing credentials in the URL
      remoteUrl = remoteUrl.replace(/^https:\/\/[^@]+@/, "https://");
      const authUrl = remoteUrl.replace("https://", `https://${tokenValue}@`);
      // Set the remote URL with token
      await this.git.cwd(repoPath).remote(["set-url", "origin", authUrl]);
    }
  }

  private extractRepoName(repoUrl: string): string {
    // Extract repository name from URL
    const match = repoUrl.match(/github\.com\/[^/]+\/([^/]+)(?:\.git)?$/);
    if (!match) {
      throw new Error("Invalid repository URL");
    }
    return match[1];
  }

  async getBranches(
    repoUrl: string,
    tokenId: string,
    userId: string
  ): Promise<string[]> {
    const tokenValue = await this.githubTokenService.getTokenValue(
      tokenId,
      userId
    );
    const octokit = this.createOctokit(tokenValue);

    try {
      const { owner, repo } = this.extractOwnerAndRepo(repoUrl);
      const { data: branches } = await octokit.repos.listBranches({
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

  async createWebhook(
    repoUrl: string,
    tokenId: string,
    userId: string,
    webhookUrl: string
  ): Promise<number> {
    const tokenValue = await this.githubTokenService.getTokenValue(
      tokenId,
      userId
    );
    const octokit = this.createOctokit(tokenValue);

    try {
      const { owner, repo } = this.extractOwnerAndRepo(repoUrl);
      const { data: webhook } = await octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: "json",
        },
        events: ["push"],
        active: true,
      });

      return webhook.id;
    } catch (error) {
      console.error("Error creating webhook:", error);
      if (error.status === 422) {
        throw new Error(
          "Webhook already exists for this URL or validation failed"
        );
      }
      if (error.status === 404) {
        throw new Error(
          "Repository not found or token lacks webhook permissions"
        );
      }
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }

  async deleteWebhook(
    repoUrl: string,
    tokenId: string,
    userId: string,
    hookId: number
  ): Promise<void> {
    const tokenValue = await this.githubTokenService.getTokenValue(
      tokenId,
      userId
    );
    const octokit = this.createOctokit(tokenValue);

    try {
      const { owner, repo } = this.extractOwnerAndRepo(repoUrl);
      await octokit.repos.deleteWebhook({
        owner,
        repo,
        hook_id: hookId,
      });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      if (error.status === 404) {
        // Webhook already deleted, ignore
        return;
      }
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  private extractOwnerAndRepo(repoUrl: string): {
    owner: string;
    repo: string;
  } {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new Error("Invalid GitHub repository URL");
    }
    const [, owner, repoName] = match;
    // Remove .git suffix if present
    const repo = repoName.replace(/\.git$/, "");
    return { owner, repo };
  }

  private createSlug(serviceName: string): string {
    return serviceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
