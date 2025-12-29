import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Octokit } from "@octokit/rest";
import {
  GithubToken,
  GithubTokenDocument,
} from "@/schemas/github-token.schema";
import {
  CreateGithubTokenDto,
  UpdateGithubTokenDto,
  GithubTokenResponse,
} from "./dto/github-token.dto";

@Injectable()
export class GithubTokenService {
  constructor(
    @InjectModel(GithubToken.name)
    private githubTokenModel: Model<GithubTokenDocument>
  ) {}

  async create(
    createDto: CreateGithubTokenDto,
    userId: string
  ): Promise<GithubTokenDocument> {
    const token = new this.githubTokenModel({
      ...createDto,
      createdBy: new Types.ObjectId(userId),
    });
    return token.save();
  }

  async findAll(userId: string): Promise<GithubTokenResponse[]> {
    // Get tokens that are:
    // 1. Created by the user (private or public)
    // 2. Public tokens created by other users
    const tokens = await this.githubTokenModel
      .find({
        $or: [
          { createdBy: new Types.ObjectId(userId) },
          { visibility: "public" },
        ],
      })
      .populate("createdBy", "_id username")
      .sort({ createdAt: -1 });

    return tokens.map((token) => this.toResponse(token, userId));
  }

  async findById(
    tokenId: string,
    userId: string
  ): Promise<GithubTokenDocument | null> {
    const token = await this.githubTokenModel.findById(tokenId);

    if (!token) {
      return null;
    }

    // Check access
    const isOwner = token.createdBy.toString() === userId;
    const isPublic = token.visibility === "public";

    if (!isOwner && !isPublic) {
      throw new ForbiddenException("You do not have access to this token");
    }

    return token;
  }

  async getTokenValue(tokenId: string, userId: string): Promise<string> {
    const token = await this.findById(tokenId, userId);

    if (!token) {
      throw new NotFoundException("Token not found");
    }

    // Update last used timestamp
    await this.githubTokenModel.findByIdAndUpdate(tokenId, {
      lastUsedAt: new Date(),
    });

    return token.token;
  }

  async update(
    tokenId: string,
    updateDto: UpdateGithubTokenDto,
    userId: string
  ): Promise<GithubTokenDocument> {
    const token = await this.githubTokenModel.findById(tokenId);

    if (!token) {
      throw new NotFoundException("Token not found");
    }

    // Only owner can update
    if (token.createdBy.toString() !== userId) {
      throw new ForbiddenException("Only the token owner can update it");
    }

    Object.assign(token, updateDto);
    return token.save();
  }

  async delete(tokenId: string, userId: string): Promise<void> {
    const token = await this.githubTokenModel.findById(tokenId);

    if (!token) {
      throw new NotFoundException("Token not found");
    }

    // Only owner can delete
    if (token.createdBy.toString() !== userId) {
      throw new ForbiddenException("Only the token owner can delete it");
    }

    await this.githubTokenModel.findByIdAndDelete(tokenId);
  }

  async validateToken(tokenValue: string): Promise<boolean> {
    try {
      const octokit = new Octokit({ auth: tokenValue });
      await octokit.users.getAuthenticated();
      return true;
    } catch {
      return false;
    }
  }

  private toResponse(
    token: GithubTokenDocument,
    userId: string
  ): GithubTokenResponse {
    const createdBy = token.createdBy as any;
    return {
      _id: token._id.toString(),
      name: token.name,
      visibility: token.visibility,
      createdBy: {
        _id: createdBy._id?.toString() || createdBy.toString(),
        username: createdBy.username || "Unknown",
      },
      isActive: token.isActive,
      isOwner: token.createdBy.toString() === userId,
      createdAt: (token as any).createdAt,
      updatedAt: (token as any).updatedAt,
      lastUsedAt: token.lastUsedAt?.toISOString(),
    };
  }
}
