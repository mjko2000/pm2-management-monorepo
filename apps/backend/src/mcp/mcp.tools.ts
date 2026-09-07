import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { PM2Service } from "../pm2/pm2.service";
import { Service } from "../schemas/service.schema";
import { Log } from "../schemas/log.schema";
import { MCP_ADMIN } from "./mcp.auth";

const SERVICE_REF_MAX = 128;

type ServiceLike = Record<string, any>;

@Injectable()
export class McpToolsService {
  constructor(
    private readonly pm2Service: PM2Service,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Log.name) private readonly logModel: Model<Log>,
  ) {}

  async listServices() {
    const services = await this.pm2Service.getServices(MCP_ADMIN);
    return services.map((service) => this.toListItem(service));
  }

  async getService(ref: string) {
    const id = await this.resolveServiceId(ref);
    const service = await this.pm2Service.getService(MCP_ADMIN, id);
    if (!service) {
      throw new NotFoundException(`Service not found: ${ref}`);
    }
    return this.toDetail(service);
  }

  async startService(ref: string) {
    const id = await this.resolveServiceId(ref);
    const service = await this.pm2Service.startService(id);
    if (!service) {
      throw new NotFoundException(`Service not found: ${ref}`);
    }
    return this.toDetail(service);
  }

  async stopService(ref: string) {
    const id = await this.resolveServiceId(ref);
    const service = await this.pm2Service.stopService(id);
    if (!service) {
      throw new NotFoundException(
        `Service not found or not started: ${ref}`,
      );
    }
    return this.toDetail(service);
  }

  async restartService(ref: string) {
    const id = await this.resolveServiceId(ref);
    const service = await this.pm2Service.restartService(id);
    if (!service) {
      throw new NotFoundException(
        `Service not found or not started: ${ref}`,
      );
    }
    return this.toDetail(service);
  }

  async reloadService(ref: string) {
    const id = await this.resolveServiceId(ref);
    const service = await this.pm2Service.reloadService(id);
    if (!service) {
      throw new NotFoundException(`Service not found: ${ref}`);
    }
    return this.toDetail(service);
  }

  async getServiceLogs(ref: string, lines?: number) {
    const id = await this.resolveServiceId(ref);
    const logs = await this.pm2Service.getServiceLogs(id, lines);
    return { service: ref, lines: lines ?? 100, logs };
  }

  async getDashboardLogs(options: {
    limit?: number;
    skip?: number;
    level?: string;
    context?: string;
  }) {
    const limit = this.clampInt(options.limit, 10, 1, 200);
    const skip = this.clampInt(options.skip, 0, 0, 100_000);
    const query: Record<string, string> = {};
    if (options.level) query.level = options.level;
    if (options.context) query.context = options.context;

    const [logs, total] = await Promise.all([
      this.logModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.logModel.countDocuments(query),
    ]);

    return {
      total,
      limit,
      skip,
      logs: logs.map((log) => ({
        id: log._id?.toString(),
        level: log.level,
        message: log.message,
        context: log.context,
        timestamp: log.timestamp,
        trace: log.trace,
      })),
    };
  }

  async getServiceMetrics(ref: string) {
    const id = await this.resolveServiceId(ref);
    const metrics = await this.pm2Service.getServiceMetrics(id);
    if (!metrics) {
      throw new NotFoundException(
        `Service not found or not running: ${ref}`,
      );
    }
    return metrics;
  }

  async getSystemMetrics() {
    return this.pm2Service.getSystemMetrics();
  }

  async resolveServiceId(ref: string): Promise<string> {
    const trimmed = ref.trim();
    if (!trimmed || trimmed.length > SERVICE_REF_MAX) {
      throw new NotFoundException("Service id or name is required");
    }

    if (this.isObjectId(trimmed)) {
      const byId = await this.serviceModel.findById(trimmed).select("_id").exec();
      if (byId) {
        return byId._id.toString();
      }
    }

    const byName = await this.serviceModel
      .findOne({ name: trimmed })
      .select("_id")
      .exec();
    if (byName) {
      return byName._id.toString();
    }

    throw new NotFoundException(`Service not found: ${trimmed}`);
  }

  private isObjectId(value: string): boolean {
    return (
      Types.ObjectId.isValid(value) &&
      new Types.ObjectId(value).toString() === value
    );
  }

  private clampInt(
    value: number | undefined,
    fallback: number,
    min: number,
    max: number,
  ): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(Math.max(Math.floor(value as number), min), max);
  }

  private envNames(service: ServiceLike): string[] {
    const environments = Array.isArray(service.environments)
      ? service.environments
      : [];
    return environments
      .map((env: { name?: string }) => env?.name)
      .filter((name: unknown): name is string => typeof name === "string");
  }

  private toListItem(service: ServiceLike) {
    return {
      id: this.serviceId(service),
      name: service.name,
      status: service.status,
      pm2AppName: service.pm2AppName,
      branch: service.branch,
      repositoryUrl: service.repositoryUrl,
      environments: this.envNames(service),
      serviceType: service.serviceType,
      port: service.port,
    };
  }

  private toDetail(service: ServiceLike) {
    const environments = Array.isArray(service.environments)
      ? service.environments
      : [];

    return {
      id: this.serviceId(service),
      name: service.name,
      status: service.status,
      pm2AppName: service.pm2AppName,
      branch: service.branch,
      repositoryUrl: service.repositoryUrl,
      sourceDirectory: service.sourceDirectory,
      serviceType: service.serviceType,
      port: service.port,
      packageManager: service.packageManager,
      nodeVersion: service.nodeVersion,
      cluster: service.cluster,
      autostart: service.autostart,
      visibility: service.visibility,
      activeEnvironment: service.activeEnvironment,
      environments: environments.map((env: { name?: string; description?: string }) => ({
        name: env.name,
        description: env.description,
      })),
      useNpm: service.useNpm,
      npmScript: service.npmScript,
      script: service.script,
      outputDirectory: service.outputDirectory,
      webhookEnabled: service.webhookEnabled,
      createdBy: service.createdBy,
    };
  }

  private serviceId(service: ServiceLike): string {
    const raw = service._id ?? service.id;
    return raw?.toString?.() ?? String(raw);
  }
}
