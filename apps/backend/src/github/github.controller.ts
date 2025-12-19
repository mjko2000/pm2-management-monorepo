import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { GitHubService } from "./github.service";
import { Repository } from "@pm2-dashboard/shared";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";

class SetTokenDto {
  token: string;
  username?: string;
}

class CloneRepoDto {
  repoUrl: string;
  branch: string;
  serviceName?: string;
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("github")
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @Post("token")
  async setToken(
    @Body() setTokenDto: SetTokenDto
  ): Promise<{ success: boolean }> {
    this.githubService.setToken(setTokenDto.token);
    return { success: true };
  }

  @Get("token/validate")
  async validateGitHubToken(): Promise<boolean> {
    return await this.githubService.validateToken();
  }

  @Get("repositories")
  async getRepositories(): Promise<Repository[]> {
    return this.githubService.getRepositories();
  }

  @Get("branches")
  async getBranches(@Query("repoUrl") repoUrl: string): Promise<string[]> {
    return this.githubService.getBranches(repoUrl);
  }

  @Post("clone")
  async cloneRepository(
    @Body() cloneRepoDto: CloneRepoDto
  ): Promise<{ path: string }> {
    const path = await this.githubService.cloneRepository(
      cloneRepoDto.repoUrl,
      cloneRepoDto.branch,
      cloneRepoDto.serviceName
    );
    return { path };
  }
}
