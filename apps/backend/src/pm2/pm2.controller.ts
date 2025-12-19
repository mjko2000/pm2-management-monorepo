import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { PM2Service } from "./pm2.service";
import { PM2Service as IPM2Service, Environment } from "@pm2-dashboard/shared";
import { Service } from "@/schemas/service.schema";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "@/auth/decorators/current-user.decorator";

// DTOs for requests
class CreateServiceDto
  implements Omit<IPM2Service, "_id" | "status" | "pm2AppName">
{
  name: string;
  repositoryUrl: string;
  branch: string;
  script: string;
  sourceDirectory?: string;
  useNpm?: boolean;
  npmScript?: string;
  npmArgs?: string;
  args?: string;
  environments: Environment[];
  activeEnvironment?: string;
  nodeVersion?: string;
  repoPath?: string;
  cluster?: number | null;
  githubTokenId?: string;
  visibility?: "private" | "public";
}

class UpdateServiceDto implements Partial<IPM2Service> {
  name?: string;
  repositoryUrl?: string;
  branch?: string;
  script?: string;
  sourceDirectory?: string;
  useNpm?: boolean;
  npmScript?: string;
  npmArgs?: string;
  args?: string;
  nodeVersion?: string;
  repoPath?: string;
  cluster?: number | null;
  visibility?: "private" | "public";
  githubTokenId?: string;
}

class EnvironmentDto implements Environment {
  name: string;
  description?: string;
  variables: Record<string, string>;
}

class UpdateEnvironmentDto implements Partial<Environment> {
  name?: string;
  description?: string;
  variables?: Record<string, string>;
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("services")
export class PM2Controller {
  constructor(private readonly pm2Service: PM2Service) {}

  @Get()
  async getAllServices(
    @CurrentUser() user: CurrentUserPayload
  ): Promise<Service[]> {
    return this.pm2Service.getServices(user);
  }

  @Get("node/versions")
  async getAvailableNodeVersions(): Promise<string[]> {
    return this.pm2Service.getAvailableNodeVersions();
  }

  @Get(":id")
  async getService(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ): Promise<Service> {
    const service = await this.pm2Service.getService(user, id);
    if (!service) {
      throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
    }
    return service;
  }

  @Post()
  async createService(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createServiceDto: CreateServiceDto
  ): Promise<Service> {
    return this.pm2Service.createService(createServiceDto, user.userId);
  }

  @Put(":id")
  async updateService(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Body() updateServiceDto: UpdateServiceDto
  ): Promise<Service> {
    const service = await this.pm2Service.updateService(
      user,
      id,
      updateServiceDto
    );
    if (!service) {
      throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
    }
    return service;
  }

  @Delete(":id")
  async deleteService(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ): Promise<{ success: boolean }> {
    const success = await this.pm2Service.deleteService(user, id);
    if (!success) {
      throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
    }
    return { success };
  }

  @Post(":id/start")
  async startService(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ): Promise<Service> {
    try {
      await this.pm2Service.checkServicePermission(user, id, "write");
      const service = await this.pm2Service.startService(id);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to start service",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":id/stop")
  async stopService(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ): Promise<Service> {
    try {
      await this.pm2Service.checkServicePermission(user, id, "write");
      const service = await this.pm2Service.stopService(id);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to stop service",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":id/restart")
  async restartService(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ): Promise<Service> {
    try {
      await this.pm2Service.checkServicePermission(user, id, "write");
      const service = await this.pm2Service.restartService(id);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to restart service",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":id/reload")
  async reloadService(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ): Promise<Service> {
    try {
      await this.pm2Service.checkServicePermission(user, id, "write");
      const service = await this.pm2Service.reloadService(id);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to reload service",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":id/environments")
  async addEnvironment(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Body() environmentDto: EnvironmentDto
  ): Promise<Service> {
    try {
      await this.pm2Service.checkServicePermission(user, id, "write");
      const service = await this.pm2Service.addEnvironment(id, environmentDto);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to add environment",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(":id/environments/:name")
  async updateEnvironment(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Param("name") name: string,
    @Body() updateEnvironmentDto: UpdateEnvironmentDto
  ): Promise<Service> {
    try {
      await this.pm2Service.checkServicePermission(user, id, "write");
      const service = await this.pm2Service.updateEnvironment(
        id,
        name,
        updateEnvironmentDto
      );
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to update environment",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(":id/environments/:name")
  async deleteEnvironment(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Param("name") name: string
  ): Promise<Service> {
    try {
      await this.pm2Service.checkServicePermission(user, id, "write");
      const service = await this.pm2Service.deleteEnvironment(id, name);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to delete environment",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":id/environments/:name/activate")
  async setActiveEnvironment(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Param("name") name: string
  ): Promise<Service> {
    try {
      await this.pm2Service.checkServicePermission(user, id, "write");
      const service = await this.pm2Service.setActiveEnvironment(id, name);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to set active environment",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("metrics/system")
  async getSystemMetrics() {
    try {
      return await this.pm2Service.getSystemMetrics();
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to get system metrics",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id/metrics")
  async getServiceMetrics(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ) {
    try {
      await this.pm2Service.checkServicePermission(user, id, "read");
      const metrics = await this.pm2Service.getServiceMetrics(id);
      if (!metrics) {
        throw new HttpException(
          "Service not found or not running",
          HttpStatus.NOT_FOUND
        );
      }
      return metrics;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to get service metrics",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id/logs")
  async getServiceLogs(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Query("lines") lines: string = "100"
  ) {
    try {
      await this.pm2Service.checkServicePermission(user, id, "read");
      const logs = await this.pm2Service.getServiceLogs(id, parseInt(lines));
      return { logs };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to get service logs",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
