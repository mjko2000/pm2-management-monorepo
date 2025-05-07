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
} from "@nestjs/common";
import { PM2Service } from "./pm2.service";
import { PM2Service as IPM2Service, Environment } from "@pm2-dashboard/shared";
import { Service } from "@/schemas/service.schema";

// DTOs for requests
class CreateServiceDto
  implements Omit<IPM2Service, "_id" | "status" | "pm2Id">
{
  name: string;
  repositoryUrl: string;
  branch: string;
  script: string;
  sourceDirectory?: string;
  args?: string[];
  environments: Environment[];
  activeEnvironment?: string;
}

class UpdateServiceDto implements Partial<IPM2Service> {
  name?: string;
  repositoryUrl?: string;
  branch?: string;
  script?: string;
  sourceDirectory?: string;
  args?: string[];
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

@Controller("services")
export class PM2Controller {
  constructor(private readonly pm2Service: PM2Service) {}

  @Get()
  async getAllServices(): Promise<Service[]> {
    return this.pm2Service.getServices();
  }

  @Get(":id")
  async getService(@Param("id") id: string): Promise<Service> {
    const service = await this.pm2Service.getService(id);
    if (!service) {
      throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
    }
    return service;
  }

  @Post()
  async createService(
    @Body() createServiceDto: CreateServiceDto
  ): Promise<Service> {
    return this.pm2Service.createService(createServiceDto);
  }

  @Put(":id")
  async updateService(
    @Param("id") id: string,
    @Body() updateServiceDto: UpdateServiceDto
  ): Promise<Service> {
    const service = await this.pm2Service.updateService(id, updateServiceDto);
    if (!service) {
      throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
    }
    return service;
  }

  @Delete(":id")
  async deleteService(@Param("id") id: string): Promise<{ success: boolean }> {
    const success = await this.pm2Service.deleteService(id);
    if (!success) {
      throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
    }
    return { success };
  }

  @Post(":id/start")
  async startService(@Param("id") id: string): Promise<Service> {
    try {
      const service = await this.pm2Service.startService(id);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to start service",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":id/stop")
  async stopService(@Param("id") id: string): Promise<Service> {
    try {
      const service = await this.pm2Service.stopService(id);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to stop service",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":id/restart")
  async restartService(@Param("id") id: string): Promise<Service> {
    try {
      const service = await this.pm2Service.restartService(id);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to restart service",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":id/environments")
  async addEnvironment(
    @Param("id") id: string,
    @Body() environmentDto: EnvironmentDto
  ): Promise<Service> {
    try {
      const service = await this.pm2Service.addEnvironment(id, environmentDto);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to add environment",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(":id/environments/:name")
  async updateEnvironment(
    @Param("id") id: string,
    @Param("name") name: string,
    @Body() updateEnvironmentDto: UpdateEnvironmentDto
  ): Promise<Service> {
    try {
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
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(":id/environments/:name")
  async deleteEnvironment(
    @Param("id") id: string,
    @Param("name") name: string
  ): Promise<Service> {
    try {
      const service = await this.pm2Service.deleteEnvironment(id, name);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to delete environment",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":id/environments/:name/activate")
  async setActiveEnvironment(
    @Param("id") id: string,
    @Param("name") name: string
  ): Promise<Service> {
    try {
      const service = await this.pm2Service.setActiveEnvironment(id, name);
      if (!service) {
        throw new HttpException("Service not found", HttpStatus.NOT_FOUND);
      }
      return service;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to set active environment",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
