import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Headers,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { WebhookService } from "./webhook.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("webhook")
@Controller()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Public endpoint to receive GitHub push events
   */
  @Public()
  @Post("webhook/:deployKey")
  async handleGitHubWebhook(
    @Param("deployKey") deployKey: string,
    @Body() payload: any,
    @Headers("x-github-event") githubEvent: string
  ) {
    // Only process push events
    if (githubEvent !== "push") {
      return {
        success: true,
        message: `Event ${githubEvent} ignored (only push events are processed)`,
      };
    }

    try {
      return await this.webhookService.handlePushEvent(deployKey, payload);
    } catch (error) {
      if (error.status === 404) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error.message || "Failed to process webhook",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Enable webhook for a service (creates webhook on GitHub)
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("services/:id/webhook/enable")
  async enableWebhook(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") serviceId: string
  ) {
    try {
      const service = await this.webhookService.enableWebhook(user, serviceId);
      return {
        success: true,
        message: "Webhook enabled successfully",
        webhookEnabled: service.webhookEnabled,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to enable webhook",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Disable webhook for a service (deletes webhook from GitHub)
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete("services/:id/webhook/disable")
  async disableWebhook(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") serviceId: string
  ) {
    try {
      const service = await this.webhookService.disableWebhook(user, serviceId);
      return {
        success: true,
        message: "Webhook disabled successfully",
        webhookEnabled: service.webhookEnabled,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to disable webhook",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get webhook status for a service
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("services/:id/webhook/status")
  async getWebhookStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") serviceId: string
  ) {
    try {
      return await this.webhookService.getWebhookStatus(user, serviceId);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to get webhook status",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

