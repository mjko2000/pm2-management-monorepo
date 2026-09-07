import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../auth/decorators/current-user.decorator";
import { CreateMcpTokenDto, UpdateMcpTokenDto } from "./mcp.token.dto";
import { McpTokenService } from "./mcp.token.service";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("mcp/tokens")
export class McpTokenController {
  constructor(private readonly mcpTokenService: McpTokenService) {}

  @Get()
  list() {
    return this.mcpTokenService.findAll();
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateMcpTokenDto,
  ) {
    return this.mcpTokenService.create(dto, user.userId);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateMcpTokenDto) {
    return this.mcpTokenService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.mcpTokenService.delete(id);
    return { success: true };
  }

  @Post(":id/regenerate")
  regenerate(@Param("id") id: string) {
    return this.mcpTokenService.regenerate(id);
  }
}
