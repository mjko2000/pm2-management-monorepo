import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DomainService, CreateDomainDto } from "./domain.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

interface CurrentUserPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

@ApiTags("Domains")
@ApiBearerAuth()
@Controller("domains")
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get("server-ip")
  @ApiOperation({ summary: "Get server IP for DNS configuration" })
  getServerIp() {
    return {
      serverIp: this.domainService.getServerIp(),
    };
  }

  @Get("service/:serviceId")
  @ApiOperation({ summary: "Get all domains for a service" })
  async getDomainsForService(
    @CurrentUser() user: CurrentUserPayload,
    @Param("serviceId") serviceId: string
  ) {
    return this.domainService.getDomainsForService(user, serviceId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a domain by ID" })
  async getDomain(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ) {
    return this.domainService.getDomain(user, id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new domain configuration" })
  @HttpCode(HttpStatus.CREATED)
  async createDomain(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateDomainDto
  ) {
    return this.domainService.createDomain(user, dto);
  }

  @Post(":id/verify")
  @ApiOperation({ summary: "Verify DNS configuration for a domain" })
  @HttpCode(HttpStatus.OK)
  async verifyDomain(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ) {
    return this.domainService.verifyDomain(user, id);
  }

  @Post(":id/activate")
  @ApiOperation({ summary: "Activate domain - create nginx config and SSL" })
  @HttpCode(HttpStatus.OK)
  async activateDomain(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ) {
    return this.domainService.activateDomain(user, id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a domain and its nginx configuration" })
  @HttpCode(HttpStatus.OK)
  async deleteDomain(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string
  ) {
    return this.domainService.deleteDomain(user, id);
  }
}

