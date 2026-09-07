import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { createHash, randomBytes } from "crypto";
import { McpToken } from "../schemas/mcp-token.schema";
import { CreateMcpTokenDto, UpdateMcpTokenDto } from "./mcp.token.dto";
import { McpPermission } from "./mcp.permissions";

export interface McpTokenResponse {
  _id: string;
  name: string;
  tokenPrefix: string;
  permissions: McpPermission[];
  isActive: boolean;
  lastUsedAt?: Date;
  createdBy?: { _id: string; username: string };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface McpTokenCreatedResponse extends McpTokenResponse {
  token: string;
}

export interface McpAuthContext {
  id: string;
  name: string;
  permissions: McpPermission[];
}

@Injectable()
export class McpTokenService {
  constructor(
    @InjectModel(McpToken.name) private readonly tokenModel: Model<McpToken>,
  ) {}

  generatePlaintext(): string {
    return `mcp_${randomBytes(24).toString("hex")}`;
  }

  hashToken(plaintext: string): string {
    return createHash("sha256").update(plaintext).digest("hex");
  }

  tokenPrefix(plaintext: string): string {
    return plaintext.slice(0, 12);
  }

  async create(
    dto: CreateMcpTokenDto,
    userId: string,
  ): Promise<McpTokenCreatedResponse> {
    const token = this.generatePlaintext();
    const created = await this.tokenModel.create({
      name: dto.name.trim(),
      tokenHash: this.hashToken(token),
      tokenPrefix: this.tokenPrefix(token),
      permissions: dto.permissions,
      isActive: true,
      createdBy: new Types.ObjectId(userId),
    });
    const populated = await created.populate("createdBy", "_id username");
    return { ...this.toResponse(populated), token };
  }

  async findAll(): Promise<McpTokenResponse[]> {
    const tokens = await this.tokenModel
      .find()
      .populate("createdBy", "_id username")
      .sort({ createdAt: -1 })
      .exec();
    return tokens.map((token) => this.toResponse(token));
  }

  async update(
    id: string,
    dto: UpdateMcpTokenDto,
  ): Promise<McpTokenResponse> {
    const token = await this.tokenModel
      .findByIdAndUpdate(
        id,
        { $set: dto },
        { new: true, runValidators: true },
      )
      .populate("createdBy", "_id username")
      .exec();
    if (!token) {
      throw new NotFoundException("MCP token not found");
    }
    return this.toResponse(token);
  }

  async delete(id: string): Promise<void> {
    const result = await this.tokenModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException("MCP token not found");
    }
  }

  async regenerate(id: string): Promise<McpTokenCreatedResponse> {
    const existing = await this.tokenModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException("MCP token not found");
    }
    const token = this.generatePlaintext();
    existing.tokenHash = this.hashToken(token);
    existing.tokenPrefix = this.tokenPrefix(token);
    await existing.save();
    const populated = await existing.populate("createdBy", "_id username");
    return { ...this.toResponse(populated), token };
  }

  async findActiveByPlaintext(
    plaintext: string,
  ): Promise<McpAuthContext | null> {
    const token = await this.tokenModel
      .findOne({ tokenHash: this.hashToken(plaintext), isActive: true })
      .exec();
    if (!token) {
      return null;
    }
    return {
      id: token._id.toString(),
      name: token.name,
      permissions: token.permissions,
    };
  }

  async touchLastUsed(id: string): Promise<void> {
    await this.tokenModel
      .updateOne({ _id: id }, { $set: { lastUsedAt: new Date() } })
      .exec();
  }

  private toResponse(token: McpToken): McpTokenResponse {
    const createdBy = token.createdBy as
      | { _id: Types.ObjectId; username: string }
      | Types.ObjectId
      | undefined;
    const owner =
      createdBy && typeof createdBy === "object" && "username" in createdBy
        ? {
            _id: createdBy._id.toString(),
            username: createdBy.username,
          }
        : undefined;

    return {
      _id: token._id.toString(),
      name: token.name,
      tokenPrefix: token.tokenPrefix,
      permissions: token.permissions,
      isActive: token.isActive,
      lastUsedAt: token.lastUsedAt,
      createdBy: owner,
      createdAt: (token as any).createdAt,
      updatedAt: (token as any).updatedAt,
    };
  }
}
