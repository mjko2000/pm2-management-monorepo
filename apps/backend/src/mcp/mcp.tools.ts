import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { GitHubService } from "../github/github.service";
import { GithubTokenService } from "../github/github-token.service";
import { PM2Service } from "../pm2/pm2.service";
import { Service } from "../schemas/service.schema";
import { Log } from "../schemas/log.schema";
import { GithubToken } from "../schemas/github-token.schema";
import { MCP_ADMIN } from "./mcp.auth";

const SERVICE_REF_MAX = 128;
const SERVICE_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;
const BRANCH_REGEX = /^[A-Za-z0-9._/-]+$/;
const NO_SHELL_METACHARS = /^(?:(?![;|&`\n\r]|\$\().)*$/;

export interface CreateMcpServiceInput {
  name: string;
  repositoryUrl: string;
  branch: string;
  githubToken: string;
  script?: string;
  sourceDirectory?: string;
  useNpm?: boolean;
  npmScript?: string;
  npmArgs?: string;
  args?: string;
  nodeVersion?: string;
  cluster?: number | null;
  visibility?: "private" | "public";
  serviceType?: "node" | "static";
  outputDirectory?: string;
  port?: number;
  autostart?: boolean;
  packageManager?: "yarn" | "npm" | "pnpm";
  activeEnvironment?: string;
  environments?: Array<{
    name: string;
    description?: string;
    variables?: Record<string, string>;
  }>;
}

type ServiceLike = Record<string, any>;

@Injectable()
export class McpToolsService {
  constructor(
    private readonly pm2Service: PM2Service,
    private readonly githubService: GitHubService,
    private readonly githubTokenService: GithubTokenService,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Log.name) private readonly logModel: Model<Log>,
    @InjectModel(GithubToken.name)
    private readonly githubTokenModel: Model<GithubToken>,
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

  async listGithubTokens(createdByUserId: string) {
    this.requireTokenOwner(createdByUserId);
    const tokens = await this.githubTokenService.findAll(createdByUserId);
    return tokens
      .filter((token) => token.isActive)
      .map((token) => ({
        id: token._id,
        name: token.name,
        visibility: token.visibility,
        isOwner: token.isOwner,
      }));
  }

  async listGithubRepositories(
    githubToken: string,
    createdByUserId: string,
  ) {
    this.requireTokenOwner(createdByUserId);
    const githubTokenId = await this.resolveGithubTokenId(githubToken);
    const repositories = await this.githubService.getRepositories(
      githubTokenId,
      createdByUserId,
    );
    return {
      githubTokenId,
      repositories: repositories.map((repo) => ({
        name: repo.name,
        fullName: repo.fullName,
        repositoryUrl: repo.url,
        defaultBranch: repo.defaultBranch,
        description: repo.description,
      })),
    };
  }

  async listGithubBranches(
    repositoryUrl: string,
    githubToken: string,
    createdByUserId: string,
  ) {
    this.requireTokenOwner(createdByUserId);
    const url = repositoryUrl?.trim();
    if (!url || url.length > 2048) {
      throw new BadRequestException("repositoryUrl is required");
    }
    const githubTokenId = await this.resolveGithubTokenId(githubToken);
    const branches = await this.githubService.getBranches(
      url,
      githubTokenId,
      createdByUserId,
    );
    return { githubTokenId, repositoryUrl: url, branches };
  }

  async createService(input: CreateMcpServiceInput, createdByUserId: string) {
    this.requireTokenOwner(createdByUserId);

    const name = input.name?.trim();
    if (!name || name.length > 48 || !SERVICE_NAME_REGEX.test(name)) {
      throw new BadRequestException(
        "name may only contain letters, numbers, dot, dash, underscore (max 48)",
      );
    }

    const existing = await this.serviceModel.findOne({ name }).select("_id").exec();
    if (existing) {
      throw new BadRequestException(`Service already exists: ${name}`);
    }

    const repositoryUrl = input.repositoryUrl?.trim();
    if (!repositoryUrl || repositoryUrl.length > 2048) {
      throw new BadRequestException("repositoryUrl is required");
    }

    const branch = input.branch?.trim();
    if (!branch || !BRANCH_REGEX.test(branch)) {
      throw new BadRequestException(
        "branch may only contain letters, numbers, dot, slash, dash, underscore",
      );
    }

    this.rejectShellMetachars("script", input.script);
    this.rejectShellMetachars("npmScript", input.npmScript);
    this.rejectShellMetachars("npmArgs", input.npmArgs);
    this.rejectShellMetachars("args", input.args);

    const githubTokenId = await this.resolveGithubTokenId(input.githubToken);
    const environments = Array.isArray(input.environments)
      ? input.environments.map((env) => ({
          name: env.name,
          description: env.description,
          variables: env.variables ?? {},
        }))
      : [];

    const created = await this.pm2Service.createService(
      {
        name,
        repositoryUrl,
        branch,
        script: input.script,
        sourceDirectory: input.sourceDirectory,
        useNpm: input.useNpm ?? false,
        npmScript: input.npmScript,
        npmArgs: input.npmArgs,
        args: input.args,
        environments,
        activeEnvironment: input.activeEnvironment,
        nodeVersion: input.nodeVersion,
        cluster: input.cluster,
        githubTokenId,
        visibility: input.visibility ?? "private",
        serviceType: input.serviceType ?? "node",
        outputDirectory: input.outputDirectory,
        port: input.port,
        autostart: input.autostart ?? false,
        packageManager: input.packageManager ?? "yarn",
      } as any,
      createdByUserId,
    );

    return this.toDetail(created);
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

  private async resolveGithubTokenId(ref: string): Promise<string> {
    const trimmed = ref?.trim();
    if (!trimmed) {
      throw new BadRequestException(
        "githubToken is required (GitHub token id or name from the dashboard)",
      );
    }

    if (this.isObjectId(trimmed)) {
      const byId = await this.githubTokenModel
        .findOne({ _id: trimmed, isActive: true })
        .select("_id")
        .exec();
      if (byId) {
        return byId._id.toString();
      }
    }

    const byName = await this.githubTokenModel
      .findOne({ name: trimmed, isActive: true })
      .select("_id")
      .exec();
    if (byName) {
      return byName._id.toString();
    }

    const available = await this.githubTokenModel
      .find({ isActive: true })
      .select("name")
      .limit(20)
      .exec();
    const names = available.map((token) => token.name).join(", ");
    throw new NotFoundException(
      `GitHub token not found: ${trimmed}.${names ? ` Available: ${names}` : ""}`,
    );
  }

  private requireTokenOwner(createdByUserId: string) {
    if (!createdByUserId || !Types.ObjectId.isValid(createdByUserId)) {
      throw new BadRequestException(
        "MCP token has no valid owner; recreate the token as an admin",
      );
    }
  }

  private rejectShellMetachars(field: string, value?: string) {
    if (value && !NO_SHELL_METACHARS.test(value)) {
      throw new BadRequestException(
        `${field} must not contain shell metacharacters (;, |, &, \`, $( or newlines)`,
      );
    }
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
