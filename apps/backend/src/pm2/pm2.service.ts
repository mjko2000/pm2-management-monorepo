import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as pm2 from "pm2";
import { promisify } from "util";
import { ConfigService } from "../config/config.service";
import { GitHubService } from "../github/github.service";
import {
  PM2Service as IPM2Service,
  Environment,
  SystemMetrics,
  ServiceStatus,
} from "@pm2-dashboard/shared";
import * as path from "path";
import { Service } from "../schemas/service.schema";
import { CustomLogger } from "../logger/logger.service";
import * as os from "os";
// Create promisified versions of pm2 functions
const connect = promisify(pm2.connect.bind(pm2));
const list = promisify(pm2.list.bind(pm2));
const start = promisify(pm2.start.bind(pm2));
const stop = promisify(pm2.stop.bind(pm2));
const restart = promisify(pm2.restart.bind(pm2));
const reload = promisify(pm2.reload.bind(pm2));
const disconnect = promisify(pm2.disconnect.bind(pm2));
const del = promisify(pm2.delete.bind(pm2));

@Injectable()
export class PM2Service {
  private nvmDir: string;
  constructor(
    private configService: ConfigService,
    private githubService: GitHubService,
    @InjectModel(Service.name)
    private serviceModel: Model<Service>,
    private logger: CustomLogger
  ) {
    this.logger.setContext("PM2Service");
    this.nvmDir = path.join(process.env.HOME, ".nvm", "versions", "node");
  }

  async getServices(): Promise<Service[]> {
    const services = await this.serviceModel.find().exec();
    await this.updateServicesStatus(services);
    return services;
  }

  async getService(id: string): Promise<Service | undefined> {
    const service = await this.serviceModel.findById(id).exec();
    if (service) {
      await this.updateServicesStatus([service]);
    }
    return service;
  }

  async createService(serviceData: Omit<IPM2Service, "_id">): Promise<Service> {
    const newService = await this.serviceModel.create(serviceData);
    return newService;
  }

  async updateService(
    id: string,
    serviceData: Partial<IPM2Service>
  ): Promise<Service | undefined> {
    const service = await this.serviceModel
      .findByIdAndUpdate(id, { $set: serviceData }, { new: true })
      .exec();
    return service;
  }

  async deleteService(id: string): Promise<boolean> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      return false;
    }

    // Stop and delete service if running
    if (service.pm2AppName) {
      try {
        await connect();
        await del(service.pm2AppName);
        await disconnect();
      } catch (error) {
        this.logger.error(`Error stopping service ${service.name}:`, error);
      }
    }

    // Remove repository folder
    try {
      await this.removeServiceRepository(service);
    } catch (error) {
      this.logger.error(
        `Error removing repository for service ${service.name}:`,
        error
      );
      // Don't fail the deletion if repository removal fails
    }

    await this.serviceModel.findByIdAndDelete(id).exec();
    return true;
  }

  private async removeServiceRepository(service: Service): Promise<void> {
    if (!service.repoPath) {
      this.logger.log(
        `No repository path stored for service ${service.name}, skipping removal`
      );
      return;
    }

    const fs = require("fs");
    if (fs.existsSync(service.repoPath)) {
      this.logger.log(`Removing repository folder: ${service.repoPath}`);

      // Remove the directory recursively
      await fs.promises.rm(service.repoPath, { recursive: true, force: true });

      this.logger.log(
        `Repository folder ${service.repoPath} removed successfully`
      );
    } else {
      this.logger.log(
        `Repository folder ${service.repoPath} does not exist, skipping removal`
      );
    }
  }

  async startService(id: string): Promise<Service | undefined> {
    this.logger.log(`Starting service ${id}`);
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }

    if (!service.activeEnvironment) {
      throw new Error(`No active environment set for service ${service.name}`);
    }

    // Get active environment
    const env = service.environments.find(
      (e) => e.name === service.activeEnvironment
    );
    if (!env) {
      throw new Error(
        `Environment ${service.activeEnvironment} not found for service ${service.name}`
      );
    }

    try {
      // Ensure repository path is set for existing services
      await this.ensureRepoPathSet(service);

      // Check if we need to recreate the PM2 process due to exec_mode change
      if (service.pm2AppName) {
        const needsRecreation = await this.needsPM2ProcessRecreation(service);
        if (needsRecreation) {
          this.logger.log(
            `Recreating PM2 process for ${service.name} due to configuration change`
          );
          await this.deletePM2ProcessByAppName(service.pm2AppName);
          service.pm2AppName = undefined;
        }
      }

      // Set building status
      service.status = ServiceStatus.BUILDING;
      await service.save();

      // Ensure repository is available (clone if not exists, pull if exists)
      const repoPath = await this.ensureRepositoryAvailable(
        service.repositoryUrl,
        service.branch,
        service.name,
        service.repoPath
      );

      // Store the repository path in the service record
      service.repoPath = repoPath;
      await service.save();

      // Write .env file
      await this.createEnvironmentFile(service, env, repoPath);

      // Run npm install and build
      await this.installAndBuild(service, repoPath);

      // Start PM2 process
      const pm2AppName = await this.startPM2Process(service, env, repoPath);

      // Update service status
      service.status = ServiceStatus.ONLINE;
      service.pm2AppName = pm2AppName;
      await service.save();

      return service;
    } catch (error) {
      this.logger.error(`Error starting service ${service.name}:`, error);
      service.status = ServiceStatus.ERRORED;
      await service.save();
      throw new Error(`Failed to start service: ${error.message}`);
    }
  }

  async stopService(id: string): Promise<Service | undefined> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service || service.pm2AppName === undefined) {
      return undefined;
    }

    try {
      await connect();
      await stop(service.pm2AppName);
      await disconnect();

      service.status = ServiceStatus.STOPPED;
      await service.save();

      return service;
    } catch (error) {
      throw new Error(`Failed to stop service: ${error.message}`);
    }
  }

  async restartService(id: string): Promise<Service | undefined> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service || service.pm2AppName === undefined) {
      return undefined;
    }

    try {
      await connect();
      await restart(service.pm2AppName);
      await disconnect();

      service.status = ServiceStatus.ONLINE;
      await service.save();

      return service;
    } catch (error) {
      throw new Error(`Failed to restart service: ${error.message}`);
    }
  }

  async reloadService(id: string): Promise<Service | undefined> {
    this.logger.log(`Reloading service ${id}`);
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }

    if (service.pm2AppName === undefined) {
      throw new Error(`Service ${service.name} is not running`);
    }

    try {
      // Ensure repository path is set for existing services
      await this.ensureRepoPathSet(service);

      // Check if we need to recreate the PM2 process due to exec_mode change
      const needsRecreation = await this.needsPM2ProcessRecreation(service);
      if (needsRecreation) {
        this.logger.log(
          `Recreating PM2 process for ${service.name} during reload due to configuration change`
        );
        await this.deletePM2ProcessByAppName(service.pm2AppName);
        service.pm2AppName = undefined;
      }

      // Set building status
      service.status = ServiceStatus.BUILDING;
      await service.save();

      // Get active environment
      const env = service.environments.find(
        (e) => e.name === service.activeEnvironment
      );
      if (!env) {
        throw new Error(
          `Environment ${service.activeEnvironment} not found for service ${service.name}`
        );
      }

      // Pull latest changes from repository
      const repoPath = await this.pullLatestChanges(
        service.repositoryUrl,
        service.branch,
        service.name,
        service.repoPath
      );

      // Store the repository path in the service record
      service.repoPath = repoPath;
      await service.save();

      // Write .env file
      await this.createEnvironmentFile(service, env, repoPath);

      // Run npm install to update dependencies
      await this.installAndBuild(service, repoPath);

      if (needsRecreation || service.pm2AppName === undefined) {
        // Start new PM2 process
        const pm2AppName = await this.startPM2Process(service, env, repoPath);
        service.pm2AppName = pm2AppName;
        this.logger.log(
          `Service ${service.name} recreated successfully with new PM2 app name: ${pm2AppName}`
        );
      } else {
        // Use PM2 reload for zero-downtime restart
        await connect();
        await reload(service.pm2AppName);
        await disconnect();
        this.logger.log(`Service ${service.name} reloaded successfully`);
      }

      service.status = ServiceStatus.ONLINE;
      await service.save();

      return service;
    } catch (error) {
      this.logger.error(`Error reloading service ${service.name}:`, error);
      service.status = ServiceStatus.ERRORED;
      await service.save();
      throw new Error(`Failed to reload service: ${error.message}`);
    }
  }

  private async ensureRepositoryAvailable(
    repoUrl: string,
    branch: string,
    serviceName: string,
    existingRepoPath?: string
  ): Promise<string> {
    const repoPath =
      existingRepoPath ||
      (await this.generateRepositoryPath(repoUrl, serviceName));

    // Check if repository already exists
    if (this.isRepositoryCloned(repoPath)) {
      this.logger.log(
        `Repository already exists at ${repoPath}, pulling latest changes...`
      );
      return this.githubService.pullRepository(repoPath, branch);
    } else {
      this.logger.log(
        `Repository not found at ${repoPath}, cloning from ${repoUrl}...`
      );
      return this.githubService.cloneRepository(repoUrl, branch, serviceName);
    }
  }

  private async pullLatestChanges(
    repoUrl: string,
    branch: string,
    serviceName: string,
    existingRepoPath?: string
  ): Promise<string> {
    const repoPath =
      existingRepoPath ||
      (await this.generateRepositoryPath(repoUrl, serviceName));

    if (!this.isRepositoryCloned(repoPath)) {
      throw new Error(
        `Repository not found at ${repoPath}, cannot pull changes`
      );
    }

    return this.githubService.pullRepository(repoPath, branch);
  }

  private async generateRepositoryPath(
    repoUrl: string,
    serviceName: string
  ): Promise<string> {
    const workingDir = await this.configService.getWorkingDirectory();
    const repoName = this.extractRepoName(repoUrl);
    const serviceSlug = this.createSlug(serviceName);
    const repoPathName = `${repoName}-${serviceSlug}`;
    return path.join(workingDir, repoPathName);
  }

  private isRepositoryCloned(repoPath: string): boolean {
    const fs = require("fs");
    return (
      fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, ".git"))
    );
  }

  private async createEnvironmentFile(
    service: Service,
    env: Environment,
    repoPath: string
  ): Promise<void> {
    const cwd = service.sourceDirectory
      ? path.join(repoPath, service.sourceDirectory)
      : repoPath;

    const fs = require("fs");
    const util = require("util");
    const writeFilePromise = util.promisify(fs.writeFile);

    if (env.variables) {
      const envContent = Object.entries(env.variables)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

      await writeFilePromise(path.join(cwd, ".env"), envContent);
      this.logger.log(`Environment file created for ${service.name}`);
    }
  }

  private async installAndBuild(
    service: Service,
    repoPath: string
  ): Promise<void> {
    const cwd = service.sourceDirectory
      ? path.join(repoPath, service.sourceDirectory)
      : repoPath;

    const { exec } = require("child_process");
    const util = require("util");
    const execPromise = util.promisify(exec);

    // Run npm install
    this.logger.log(`Installing dependencies for ${service.name}...`);

    let yarnPath = "yarn";
    if (service.nodeVersion) {
      yarnPath = `${this.nvmDir}/${service.nodeVersion}/bin/yarn`;
      this.logger.log(
        `Using Node.js version ${service.nodeVersion} for ${service.name}...`
      );
    }

    await execPromise(`${yarnPath} install`, { cwd });

    // For npm commands, run build if available
    if (service.useNpm) {
      try {
        const fs = require("fs");
        const packageJsonPath = path.join(cwd, "package.json");
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8")
        );

        if (packageJson.scripts?.build) {
          this.logger.log(`Building ${service.name}...`);
          await execPromise(`${yarnPath} run build`, { cwd });
        }
      } catch (error) {
        throw new Error(`Failed to install/build service: ${error.message}`);
      }
    }
  }

  private async startPM2Process(
    service: Service,
    env: Environment,
    repoPath: string
  ): Promise<string> {
    const cwd = service.sourceDirectory
      ? path.join(repoPath, service.sourceDirectory)
      : repoPath;

    let npmPath = "npm";
    if (service.nodeVersion) {
      npmPath = `${this.nvmDir}/${service.nodeVersion}/bin/npm`;
    }

    const appName = `${service.name}-${service.activeEnvironment}`;

    await connect();

    let startConfig: any = {
      name: appName,
      env: env.variables,
      cwd: cwd,
    };

    // Add cluster mode if specified
    if (service.cluster && service.cluster > 0) {
      startConfig.instances = service.cluster;
      startConfig.exec_mode = "cluster";
      this.logger.log(
        `Using cluster mode with ${service.cluster} instances for ${service.name}`
      );
    } else {
      startConfig.instances = 1;
      startConfig.exec_mode = "fork";
    }

    if (service.useNpm) {
      if (!service.npmScript) {
        throw new Error(`No npm script specified for service ${service.name}`);
      }
      startConfig.script = npmPath;
      startConfig.args = `${service.npmScript} ${service.npmArgs || ""}`;
    } else {
      startConfig.script = `${service.script}`;
      startConfig.args = service.args || "";
    }

    this.logger.log(
      `Starting PM2 process for ${service.name}... ${startConfig.script} ${startConfig.args}`
    );
    await start(startConfig);

    this.logger.log(
      `Service ${service.name} started with PM2 app name: ${appName}`
    );

    await disconnect();
    return appName;
  }

  private extractRepoName(repoUrl: string): string {
    // Extract repository name from URL
    const match = repoUrl.match(/github\.com\/[^/]+\/([^/]+)(?:\.git)?$/);
    if (!match) {
      throw new Error("Invalid repository URL");
    }
    return match[1];
  }

  async addEnvironment(
    serviceId: string,
    environment: Environment
  ): Promise<Service | undefined> {
    const service = await this.serviceModel.findById(serviceId).exec();
    if (!service) {
      return undefined;
    }

    // Check if environment with same name already exists
    if (service.environments.some((e) => e.name === environment.name)) {
      throw new Error(
        `Environment ${environment.name} already exists for service ${service.name}`
      );
    }

    service.environments.push(environment);

    // If this is the first environment, set it as active
    if (service.environments.length === 1) {
      service.activeEnvironment = environment.name;
    }

    await service.save();
    return service;
  }

  async updateEnvironment(
    serviceId: string,
    envName: string,
    environment: Partial<Environment>
  ): Promise<Service | undefined> {
    const service = await this.serviceModel.findById(serviceId).exec();
    if (!service) {
      return undefined;
    }

    const envIndex = service.environments.findIndex((e) => e.name === envName);
    if (envIndex === -1) {
      throw new Error(
        `Environment ${envName} not found for service ${service.name}`
      );
    }

    service.environments[envIndex] = {
      ...service.environments[envIndex],
      ...environment,
    };

    // If we're changing the environment name and it's the active environment, update that too
    if (
      environment.name &&
      environment.name !== envName &&
      service.activeEnvironment === envName
    ) {
      service.activeEnvironment = environment.name;
    }

    await service.save();
    return service;
  }

  async deleteEnvironment(
    serviceId: string,
    envName: string
  ): Promise<Service | undefined> {
    const service = await this.serviceModel.findById(serviceId).exec();
    if (!service) {
      return undefined;
    }

    const envIndex = service.environments.findIndex((e) => e.name === envName);
    if (envIndex === -1) {
      throw new Error(
        `Environment ${envName} not found for service ${service.name}`
      );
    }

    service.environments.splice(envIndex, 1);

    // If we're removing the active environment, set another one as active if available
    if (service.activeEnvironment === envName) {
      service.activeEnvironment =
        service.environments.length > 0
          ? service.environments[0].name
          : undefined;
    }

    await service.save();
    return service;
  }

  async setActiveEnvironment(
    serviceId: string,
    envName: string
  ): Promise<Service | undefined> {
    const service = await this.serviceModel.findById(serviceId).exec();
    if (!service) {
      return undefined;
    }

    // Check if the environment exists
    if (!service.environments.some((e) => e.name === envName)) {
      throw new Error(
        `Environment ${envName} not found for service ${service.name}`
      );
    }

    service.activeEnvironment = envName;
    await service.save();
    return service;
  }

  private async updateServicesStatus(services: Service[]): Promise<void> {
    try {
      await connect();
      const processes = await list();
      await disconnect();

      // Create a map of PM2 processes grouped by app name
      const processMap = new Map();
      processes.forEach((proc) => {
        const appName = proc.name;
        const status = proc.pm2_env?.status;

        if (!processMap.has(appName)) {
          processMap.set(appName, []);
        }
        processMap.get(appName).push({ status });
      });

      // Update services with PM2 status
      for (const service of services) {
        if (service.pm2AppName) {
          const appProcesses = processMap.get(service.pm2AppName);
          if (appProcesses && appProcesses.length > 0) {
            // If any process is online, consider the service online
            // If all processes are stopped/errored, consider the service errored
            const hasOnlineProcess = appProcesses.some(
              (p) => p.status === "online"
            );
            const allStopped = appProcesses.every(
              (p) => p.status === "stopped"
            );

            if (hasOnlineProcess) {
              service.status = ServiceStatus.ONLINE;
            } else if (allStopped) {
              service.status = ServiceStatus.STOPPED;
            } else {
              service.status = ServiceStatus.ERRORED;
            }
          } else {
            // App not found in PM2, mark as stopped
            service.status = ServiceStatus.STOPPED;
            service.pm2AppName = undefined;
          }
        } else {
          service.status = ServiceStatus.STOPPED;
        }
        await service.save();
      }
    } catch (error) {
      this.logger.error("Error updating services status:", error);
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;

    const cpus = os.cpus();
    const cpuUsage = cpus.map((cpu) => {
      const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
      const idle = cpu.times.idle;
      return {
        model: cpu.model,
        speed: cpu.speed,
        usage: ((total - idle) / total) * 100,
      };
    });

    return {
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercentage: memoryUsage,
      },
      cpu: {
        cores: cpus.length,
        usage: cpuUsage,
      },
    };
  }

  async getServiceMetrics(id: string) {
    const service = await this.serviceModel.findById(id).exec();
    if (!service || !service.pm2AppName) {
      return null;
    }

    try {
      await connect();
      const processes = await list();
      await disconnect();

      const serviceProcesses = processes.filter(
        (p) => p.name === service.pm2AppName
      );
      if (serviceProcesses.length === 0) {
        return null;
      }

      // Aggregate metrics from all instances
      let totalCpu = 0;
      let totalMemory = 0;
      let oldestUptime = 0;
      let totalRestarts = 0;

      // Individual process information for cluster mode
      const processDetails = serviceProcesses.map((process) => ({
        pid: process.pid,
        status: process.pm2_env?.status || "unknown",
        cpu: process.monit?.cpu || 0,
        memory: process.monit?.memory || 0,
        uptime: process.pm2_env?.pm_uptime || 0,
        restarts: process.pm2_env?.restart_time || 0,
      }));

      serviceProcesses.forEach((process) => {
        totalCpu += process.monit?.cpu || 0;
        totalMemory += process.monit?.memory || 0;
        const uptime = process.pm2_env?.pm_uptime || 0;
        if (oldestUptime === 0 || uptime < oldestUptime) {
          oldestUptime = uptime;
        }
        totalRestarts += process.pm2_env?.restart_time || 0;
      });

      return {
        cpu: totalCpu,
        memory: totalMemory,
        uptime: oldestUptime,
        restarts: totalRestarts,
        instances: serviceProcesses.length,
        processes: processDetails,
      };
    } catch (error) {
      this.logger.error(
        `Error getting metrics for service ${service.name}:`,
        error
      );
      return null;
    }
  }

  async getServiceLogs(id: string, lines: number = 100): Promise<string> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service || service.pm2AppName === undefined) {
      throw new Error("Service not found or not running");
    }

    try {
      const util = require("util");
      const { exec } = require("child_process");
      const execPromise = util.promisify(exec);

      const { stdout } = await execPromise(
        `pm2 logs "${service.pm2AppName}" --lines ${lines} --raw --nostream`
      );
      return stdout;
    } catch (error) {
      this.logger.error(
        `Error getting logs for service ${service.name}:`,
        error
      );
      throw new Error(`Failed to get service logs: ${error.message}`);
    }
  }

  async getAvailableNodeVersions(): Promise<string[]> {
    try {
      const fs = require("fs");
      const path = require("path");
      const nvmDir = this.nvmDir;

      if (!fs.existsSync(nvmDir)) {
        return [];
      }

      const versions = fs
        .readdirSync(nvmDir)
        .filter((dir) => dir.startsWith("v"))
        .sort((a, b) => {
          // Sort versions in descending order
          return b.localeCompare(a, undefined, { numeric: true });
        });

      return versions;
    } catch (error) {
      this.logger.error("Error getting Node versions:", error);
      throw new Error(`Failed to get Node versions: ${error.message}`);
    }
  }

  private createSlug(serviceName: string): string {
    return serviceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private async ensureRepoPathSet(service: Service): Promise<void> {
    if (!service.repoPath) {
      service.repoPath = await this.generateRepositoryPath(
        service.repositoryUrl,
        service.name
      );
      await service.save();
      this.logger.log(
        `Generated and stored repository path for service ${service.name}: ${service.repoPath}`
      );
    }
  }

  private async needsPM2ProcessRecreation(service: Service): Promise<boolean> {
    try {
      await connect();
      const processes = await list();
      await disconnect();

      const appProcesses = processes.filter(
        (p) => p.name === service.pm2AppName
      );
      const currentProcessLength = appProcesses.length;
      const expectedProcessLength =
        service.cluster && service.cluster > 0 ? service.cluster : 1;
      if (currentProcessLength === 0) {
        this.logger.log(
          `PM2 app ${service.pm2AppName} not found for service ${service.name}, no recreation needed`
        );
        return false; // App doesn't exist, no need to recreate
      }

      // Check the first process to get the exec_mode (all instances should have the same exec_mode)
      const currentProcess = appProcesses[0];

      // Determine what the exec_mode should be based on current service config
      const expectedExecMode =
        service.cluster && service.cluster > 0 ? "cluster_mode" : "fork_mode";
      const currentExecMode = currentProcess.pm2_env?.exec_mode;

      this.logger.log(
        `Service ${service.name}: Current exec_mode: ${currentExecMode}, Expected exec_mode: ${expectedExecMode}`
      );

      if (
        currentExecMode === expectedExecMode &&
        currentProcessLength === expectedProcessLength
      ) {
        this.logger.log(
          `Service ${service.name} configuration matches current PM2 setup, no recreation needed`
        );
        return false;
      }

      this.logger.log(
        `Service ${service.name} needs recreation due to configuration change. Current: ${currentExecMode} (${currentProcessLength} instances), Expected: ${expectedExecMode} (${expectedProcessLength} instances)`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error checking PM2 process recreation need for service ${service.name}:`,
        error
      );
      return true; // If we can't check, better to recreate to be safe
    }
  }

  private async deletePM2ProcessByAppName(pm2AppName: string): Promise<void> {
    try {
      await connect();
      await del(pm2AppName);
      await disconnect();
      this.logger.log(`Deleted PM2 process with app name: ${pm2AppName}`);
    } catch (error) {
      this.logger.error(
        `Error deleting PM2 process with app name ${pm2AppName}:`,
        error
      );
      throw error;
    }
  }
}
