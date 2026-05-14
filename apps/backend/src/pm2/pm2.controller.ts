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
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  IsObject,
  IsArray,
  Matches,
  MaxLength,
  MinLength,
  Min,
  Max,
} from "class-validator";
import { ApiBearerAuth } from "@nestjs/swagger";
import { PM2Service } from "./pm2.service";
import { Environment } from "@pm2-dashboard/shared";
import { Service } from "@/schemas/service.schema";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "@/auth/decorators/current-user.decorator";

// Defense-in-depth: even though we now spawn via execFile (no shell), reject
// strings that contain shell metacharacters in case a future change reverts to
// exec() with string interpolation.
const NO_SHELL_METACHARS = /^(?:(?![;|&`\n\r]|\$\().)*$/;
const NO_SHELL_METACHARS_MSG =
  "must not contain shell metacharacters (;, |, &, `, $( or newlines)";

// PM2 process name allowed charset (alphanumeric, dash, underscore, dot).
const SERVICE_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;

// DTOs for requests
class CreateServiceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(48)
  @Matches(SERVICE_NAME_REGEX, {
    message: "name may only contain letters, numbers, dot, dash, underscore",
  })
  name: string;

  @IsString()
  @MaxLength(2048)
  repositoryUrl: string;

  @IsString()
  @MaxLength(255)
  @Matches(/^[A-Za-z0-9._/-]+$/, {
    message:
      "branch may only contain letters, numbers, dot, slash, dash, underscore",
  })
  branch: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  @Matches(NO_SHELL_METACHARS, { message: `script ${NO_SHELL_METACHARS_MSG}` })
  script?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceDirectory?: string;

  @IsOptional()
  @IsBoolean()
  useNpm?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(NO_SHELL_METACHARS, {
    message: `npmScript ${NO_SHELL_METACHARS_MSG}`,
  })
  npmScript?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(NO_SHELL_METACHARS, { message: `npmArgs ${NO_SHELL_METACHARS_MSG}` })
  npmArgs?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(NO_SHELL_METACHARS, { message: `args ${NO_SHELL_METACHARS_MSG}` })
  args?: string;

  @IsArray()
  environments: Environment[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  activeEnvironment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nodeVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  repoPath?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(64)
  cluster?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  githubTokenId?: string;

  @IsOptional()
  @IsIn(["private", "public"])
  visibility?: "private" | "public";

  @IsOptional()
  @IsIn(["node", "static"])
  serviceType?: "node" | "static";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  outputDirectory?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsOptional()
  @IsBoolean()
  autostart?: boolean;

  @IsOptional()
  @IsIn(["yarn", "npm", "pnpm"])
  packageManager?: "yarn" | "npm" | "pnpm";
}

class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(48)
  @Matches(SERVICE_NAME_REGEX, {
    message: "name may only contain letters, numbers, dot, dash, underscore",
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  repositoryUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[A-Za-z0-9._/-]+$/, {
    message:
      "branch may only contain letters, numbers, dot, slash, dash, underscore",
  })
  branch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  @Matches(NO_SHELL_METACHARS, { message: `script ${NO_SHELL_METACHARS_MSG}` })
  script?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceDirectory?: string;

  @IsOptional()
  @IsBoolean()
  useNpm?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(NO_SHELL_METACHARS, {
    message: `npmScript ${NO_SHELL_METACHARS_MSG}`,
  })
  npmScript?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(NO_SHELL_METACHARS, { message: `npmArgs ${NO_SHELL_METACHARS_MSG}` })
  npmArgs?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(NO_SHELL_METACHARS, { message: `args ${NO_SHELL_METACHARS_MSG}` })
  args?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nodeVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  repoPath?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(64)
  cluster?: number | null;

  @IsOptional()
  @IsIn(["private", "public"])
  visibility?: "private" | "public";

  @IsOptional()
  @IsString()
  @MaxLength(64)
  githubTokenId?: string;

  @IsOptional()
  @IsIn(["node", "static"])
  serviceType?: "node" | "static";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  outputDirectory?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsOptional()
  @IsBoolean()
  autostart?: boolean;

  @IsOptional()
  @IsIn(["yarn", "npm", "pnpm"])
  packageManager?: "yarn" | "npm" | "pnpm";
}

class EnvironmentDto implements Environment {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message: "name may only contain letters, numbers, dot, dash, underscore",
  })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsObject()
  variables: Record<string, string>;
}

class UpdateEnvironmentDto implements Partial<Environment> {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message: "name may only contain letters, numbers, dot, dash, underscore",
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsObject()
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
