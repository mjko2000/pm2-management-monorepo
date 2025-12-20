import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { PM2Service } from "../pm2/pm2.service";
import { Environment } from "@pm2-dashboard/shared";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "@/auth/decorators/current-user.decorator";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("environment")
export class EnvironmentController {
  constructor(private readonly pm2Service: PM2Service) {}

  @Get(":serviceId/environments")
  async getEnvironments(
    @CurrentUser() user: CurrentUserPayload,
    @Param("serviceId") serviceId: string
  ): Promise<Environment[]> {
    const service = await this.pm2Service.getService(user, serviceId);
    if (!service) {
      throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
    }
    return service.environments;
  }

  @Get(":serviceId/environments/:name")
  async getEnvironment(
    @CurrentUser() user: CurrentUserPayload,
    @Param("serviceId") serviceId: string,
    @Param("name") name: string
  ): Promise<Environment> {
    const service = await this.pm2Service.getService(user, serviceId);
    if (!service) {
      throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
    }
    
    const environment = service.environments.find((e) => e.name === name);
    if (!environment) {
      throw new HttpException("Environment not found", HttpStatus.NOT_FOUND);
    }
    
    return environment;
  }

  @Get(":serviceId/active-environment")
  async getActiveEnvironment(
    @CurrentUser() user: CurrentUserPayload,
    @Param("serviceId") serviceId: string
  ): Promise<{ name: string }> {
    const service = await this.pm2Service.getService(user, serviceId);
    if (!service) {
      throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
    }
    
    if (!service.activeEnvironment) {
      throw new HttpException(
        "No active environment set",
        HttpStatus.NOT_FOUND
      );
    }
    
    return { name: service.activeEnvironment };
  }
} 
