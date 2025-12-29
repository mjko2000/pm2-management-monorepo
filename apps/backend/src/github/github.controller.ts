import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { GitHubService } from "./github.service";
import { GithubTokenService } from "./github-token.service";
import { Repository } from "@pm2-dashboard/shared";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "@/auth/decorators/current-user.decorator";
import {
  CreateGithubTokenDto,
  UpdateGithubTokenDto,
} from "./dto/github-token.dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("github")
export class GitHubController {
  constructor(
    private readonly githubService: GitHubService,
    private readonly githubTokenService: GithubTokenService
  ) {}

  // ============ Token Management ============

  @Get("tokens")
  async getTokens(@CurrentUser() user: CurrentUserPayload) {
    return this.githubTokenService.findAll(user.userId);
  }

  @Post("tokens")
  async createToken(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createDto: CreateGithubTokenDto
  ) {
    // Validate token before saving
    const isValid = await this.githubTokenService.validateToken(
      createDto.token
    );
    if (!isValid) {
      throw new Error("Invalid GitHub token. Please check and try again.");
    }

    return this.githubTokenService.create(createDto, user.userId);
  }

  @Put("tokens/:id")
  async updateToken(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Body() updateDto: UpdateGithubTokenDto
  ) {
    // If token is being updated, validate it
    if (updateDto.token) {
      const isValid = await this.githubTokenService.validateToken(
        updateDto.token
      );
      if (!isValid) {
        throw new Error("Invalid GitHub token. Please check and try again.");
      }
    }

    return this.githubTokenService.update(id, updateDto, user.userId);
  }

  @Delete("tokens/:id")
  async deleteToken(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ) {
    await this.githubTokenService.delete(id, user.userId);
    return { success: true };
  }

  @Post("tokens/:id/validate")
  async validateToken(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ) {
    const tokenValue = await this.githubTokenService.getTokenValue(
      id,
      user.userId
    );
    const isValid = await this.githubService.validateToken(tokenValue);
    return { valid: isValid };
  }

  // ============ Repository Operations ============

  @Get("repositories")
  async getRepositories(
    @CurrentUser() user: CurrentUserPayload,
    @Query("tokenId") tokenId: string
  ): Promise<Repository[]> {
    if (!tokenId) {
      throw new Error("Token ID is required");
    }
    return this.githubService.getRepositories(tokenId, user.userId);
  }

  @Get("branches")
  async getBranches(
    @CurrentUser() user: CurrentUserPayload,
    @Query("repoUrl") repoUrl: string,
    @Query("tokenId") tokenId: string
  ): Promise<string[]> {
    if (!tokenId) {
      throw new Error("Token ID is required");
    }
    return this.githubService.getBranches(repoUrl, tokenId, user.userId);
  }
}
