import { IsNotEmpty, IsString, IsIn, IsOptional, MinLength } from "class-validator";

export class CreateGithubTokenDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  name: string;

  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsIn(["private", "public"])
  visibility: "private" | "public";
}

export class UpdateGithubTokenDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsIn(["private", "public"])
  visibility?: "private" | "public";

  @IsOptional()
  isActive?: boolean;
}

export interface GithubTokenResponse {
  _id: string;
  name: string;
  visibility: "private" | "public";
  createdBy: {
    _id: string;
    username: string;
  };
  isActive: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

