import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Service } from "../schemas/service.schema";
import { GitHubService } from "../github/github.service";
import { PM2Service } from "../pm2/pm2.service";
import { CustomLogger } from "../logger/logger.service";
import { CurrentUserPayload } from "../auth/decorators/current-user.decorator";

interface PushEventPayload {
  ref: string;
  repository?: {
    full_name?: string;
  };
  pusher?: {
    name?: string;
  };
}

@Injectable()
export class WebhookService {
  private backendUrl: string;

  constructor(
    @InjectModel(Service.name)
    private serviceModel: Model<Service>,
    private githubService: GitHubService,
    @Inject(forwardRef(() => PM2Service))
    private pm2Service: PM2Service,
    private configService: ConfigService,
    private logger: CustomLogger
  ) {
    this.logger.setContext("WebhookService");
    this.backendUrl =
      this.configService.get("BACKEND_URL") || "http://localhost:3001";
  }

  async enableWebhook(
    user: CurrentUserPayload,
    serviceId: string
  ): Promise<Service> {
    const service = await this.pm2Service.checkServicePermission(
      user,
      serviceId,
      "write"
    );

    if (service.webhookEnabled && service.githubWebhookId) {
      throw new Error("Webhook is already enabled for this service");
    }

    if (!service.githubTokenId || !service.createdBy) {
      throw new Error("Service must have a GitHub token and creator assigned");
    }

    // Generate a unique deploy key
    const deployKey = uuidv4();
    const webhookUrl = `${this.backendUrl}/webhook/${deployKey}`;

    this.logger.log(
      `Creating webhook for service ${service.name}: ${webhookUrl}`
    );

    // Create webhook on GitHub
    const githubWebhookId = await this.githubService.createWebhook(
      service.repositoryUrl,
      service.githubTokenId.toString(),
      service.createdBy.toString(),
      webhookUrl
    );

    // Update service with webhook info
    service.deployKey = deployKey;
    service.webhookEnabled = true;
    service.githubWebhookId = githubWebhookId;
    await service.save();

    this.logger.log(
      `Webhook enabled for service ${service.name} with hook ID ${githubWebhookId}`
    );

    return service;
  }

  async disableWebhook(
    user: CurrentUserPayload,
    serviceId: string
  ): Promise<Service> {
    const service = await this.pm2Service.checkServicePermission(
      user,
      serviceId,
      "write"
    );

    if (!service.webhookEnabled || !service.githubWebhookId) {
      throw new Error("Webhook is not enabled for this service");
    }

    if (!service.githubTokenId || !service.createdBy) {
      throw new Error("Service must have a GitHub token and creator assigned");
    }

    this.logger.log(`Deleting webhook for service ${service.name}`);

    // Delete webhook from GitHub
    await this.githubService.deleteWebhook(
      service.repositoryUrl,
      service.githubTokenId.toString(),
      service.createdBy.toString(),
      service.githubWebhookId
    );

    // Update service
    service.deployKey = undefined;
    service.webhookEnabled = false;
    service.githubWebhookId = undefined;
    await service.save();

    this.logger.log(`Webhook disabled for service ${service.name}`);

    return service;
  }

  async handlePushEvent(
    deployKey: string,
    payload: PushEventPayload
  ): Promise<{ success: boolean; message: string }> {
    // Find service by deploy key
    const service = await this.serviceModel
      .findOne({ deployKey, webhookEnabled: true })
      .exec();

    if (!service) {
      this.logger.warn(`No service found for deploy key: ${deployKey}`);
      throw new NotFoundException("Invalid deploy key or webhook not enabled");
    }

    // Extract branch from ref (refs/heads/branch-name)
    const pushedBranch = payload.ref?.replace("refs/heads/", "");

    if (!pushedBranch) {
      return {
        success: false,
        message: "Could not determine pushed branch",
      };
    }

    // Check if the pushed branch matches the service's configured branch
    if (pushedBranch !== service.branch) {
      this.logger.log(
        `Push to ${pushedBranch} ignored for service ${service.name} (configured branch: ${service.branch})`
      );
      return {
        success: true,
        message: `Push to ${pushedBranch} ignored (service configured for ${service.branch})`,
      };
    }

    this.logger.log(
      `Triggering reload for service ${service.name} due to push to ${pushedBranch}`
    );

    // Trigger reload asynchronously (don't wait for completion)
    this.triggerReloadAsync(service._id.toString(), service.name);

    return {
      success: true,
      message: `Deployment triggered for service ${service.name}`,
    };
  }

  private async triggerReloadAsync(
    serviceId: string,
    serviceName: string
  ): Promise<void> {
    try {
      await this.pm2Service.reloadService(serviceId);
      this.logger.log(
        `Service ${serviceName} reloaded successfully via webhook`
      );
    } catch (error) {
      this.logger.error(
        `Failed to reload service ${serviceName} via webhook:`,
        error
      );
    }
  }

  async getWebhookStatus(
    user: CurrentUserPayload,
    serviceId: string
  ): Promise<{
    enabled: boolean;
    webhookUrl: string | null;
  }> {
    const service = await this.pm2Service.checkServicePermission(
      user,
      serviceId,
      "read"
    );

    return {
      enabled: service.webhookEnabled || false,
      webhookUrl: service.deployKey
        ? `${this.backendUrl}/webhook/${service.deployKey}`
        : null,
    };
  }
}
