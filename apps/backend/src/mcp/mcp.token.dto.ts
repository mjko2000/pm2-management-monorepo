import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { MCP_PERMISSIONS, McpPermission } from "./mcp.permissions";

export class CreateMcpTokenDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(MCP_PERMISSIONS, { each: true })
  permissions: McpPermission[];
}

export class UpdateMcpTokenDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(MCP_PERMISSIONS, { each: true })
  permissions?: McpPermission[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
