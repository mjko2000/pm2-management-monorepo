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
    if (service.pm2Id !== undefined) {
      try {
        await connect();
        const result = await del(service.pm2Id);
        await disconnect();
      } catch (error) {
        this.logger.error(`Error stopping service ${service.name}:`, error);
      }
    }

    await this.serviceModel.findByIdAndDelete(id).exec();
    return true;
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
      // Clone or pull repo
      const repoPath = await this.githubService.cloneRepository(
        service.repositoryUrl,
        service.branch
      );

      // Set environment variables for the service
      const envVars = env.variables;

      // Write .env file
      const cwd = service.sourceDirectory
        ? path.join(repoPath, service.sourceDirectory)
        : repoPath;

      const fs = require("fs");
      const util = require("util");
      const writeFilePromise = util.promisify(fs.writeFile);

      if (envVars) {
        const envContent = Object.entries(envVars)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n");

        await writeFilePromise(path.join(cwd, ".env"), envContent);
      }

      const { exec } = require("child_process");
      const execPromise = util.promisify(exec);

      // Run npm install
      this.logger.log(`Installing dependencies for ${service.name}...`);

      let npmPath = "npm";

      if (service.nodeVersion) {
        npmPath = `${this.nvmDir}/${service.nodeVersion}/bin/npm`;
        this.logger.log(
          `Using Node.js version ${service.nodeVersion} for ${service.name}...`
        );
      }

      await execPromise(`${npmPath} install`, { cwd });

      // For npm commands, run install and build
      if (service.useNpm) {
        try {
          // Check if package.json has build script
          const packageJsonPath = path.join(cwd, "package.json");
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf8")
          );

          if (packageJson.scripts?.build) {
            this.logger.log(`Building ${service.name}...`);
            await execPromise(`${npmPath} run build`, {
              cwd,
            });
          }
        } catch (error) {
          throw new Error(`Failed to install/build service: ${error.message}`);
        }
      }

      // Start PM2 process
      await connect();

      let startConfig: any = {
        name: `${service.name}-${service.activeEnvironment}`,
        env: envVars,
        cwd: service.sourceDirectory
          ? path.join(repoPath, service.sourceDirectory)
          : repoPath,
      };
      if (service.useNpm) {
        // Use npm to run the service
        if (!service.npmScript) {
          throw new Error(
            `No npm script specified for service ${service.name}`
          );
        }
        startConfig.script = npmPath;
        startConfig.args = `${service.npmScript} ${service.npmArgs}`;
      } else {
        startConfig.script = `${service.script}`;
        startConfig.args = service.args || "";
      }

      this.logger.log(
        `All build steps completed for ${service.name}, starting... ${startConfig.script} ${startConfig.args} ${startConfig.env ? JSON.stringify(startConfig.env) : ""}`
      );
      const startResult = await start(startConfig);

      const pm2Id =
        Array.isArray(startResult) && startResult.length > 0
          ? startResult[0].pm2_env?.pm_id
          : undefined;

      this.logger.log(`Service ${service.name} started with PM2 ID: ${pm2Id}`);

      await disconnect();

      // Update service status
      service.status = "online";
      service.pm2Id = pm2Id;
      await service.save();

      return service;
    } catch (error) {
      this.logger.error(`Error starting service ${service.name}:`, error);
      service.status = "errored";
      await service.save();
      throw new Error(`Failed to start service: ${error.message}`);
    }
  }

  async stopService(id: string): Promise<Service | undefined> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service || service.pm2Id === undefined) {
      return undefined;
    }

    try {
      await connect();
      await stop(service.pm2Id);
      await disconnect();

      service.status = "stopped";
      service.pm2Id = undefined;
      await service.save();

      return service;
    } catch (error) {
      throw new Error(`Failed to stop service: ${error.message}`);
    }
  }

  async restartService(id: string): Promise<Service | undefined> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service || service.pm2Id === undefined) {
      return undefined;
    }

    try {
      await connect();
      await restart(service.pm2Id);
      await disconnect();

      service.status = "online";
      await service.save();

      return service;
    } catch (error) {
      throw new Error(`Failed to restart service: ${error.message}`);
    }
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

      // Create a map of PM2 processes for faster lookup
      const processMap = new Map();
      processes.forEach((proc) => {
        const name = proc.name;
        const id = proc.pm_id;
        const status = proc.pm2_env?.status;
        processMap.set(id, { name, status });
      });

      // Update services with PM2 status
      for (const service of services) {
        if (service.pm2Id !== undefined) {
          const proc = processMap.get(service.pm2Id);
          if (proc) {
            service.status = proc.status === "online" ? "online" : "errored";
          } else {
            // Process no longer exists in PM2
            service.status = "stopped";
            service.pm2Id = undefined;
          }
        } else {
          service.status = "stopped";
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
    if (!service || service.pm2Id === undefined) {
      return null;
    }

    try {
      await connect();
      const processes = await list();
      await disconnect();

      const process = processes.find((p) => p.pm_id === service.pm2Id);
      if (!process) {
        return null;
      }

      return {
        cpu: process.monit?.cpu || 0,
        memory: process.monit?.memory || 0,
        uptime: process.pm2_env?.pm_uptime || 0,
        restarts: process.pm2_env?.restart_time || 0,
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
    if (!service || service.pm2Id === undefined) {
      throw new Error("Service not found or not running");
    }

    try {
      const util = require("util");
      const { exec } = require("child_process");
      const execPromise = util.promisify(exec);

      const { stdout } = await execPromise(
        `pm2 logs ${service.pm2Id} --lines ${lines} --raw --nostream`
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
}
