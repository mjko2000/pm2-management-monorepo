import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Domain, DomainDocument, DomainStatus } from "../schemas/domain.schema";
import { Service } from "../schemas/service.schema";
import { exec } from "child_process";
import { promisify } from "util";
import * as dns from "dns";
import * as fs from "fs";
import * as path from "path";
import { ConfigService as NestConfigService } from "@nestjs/config";

const execAsync = promisify(exec);
const dnsResolve4 = promisify(dns.resolve4);

export interface CreateDomainDto {
  domain: string;
  port: number;
  serviceId: string;
}

export interface CurrentUserPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

@Injectable()
export class DomainService {
  private readonly logger = new Logger(DomainService.name);
  private readonly serverIp: string;
  private readonly nginxAvailablePath: string;
  private readonly nginxEnabledPath: string;

  constructor(
    @InjectModel(Domain.name) private domainModel: Model<DomainDocument>,
    @InjectModel(Service.name) private serviceModel: Model<Service>,
    private configService: NestConfigService
  ) {
    this.serverIp = this.configService.get("SERVER_IP") || "";
    this.nginxAvailablePath =
      this.configService.get("NGINX_AVAILABLE_PATH") ||
      "/etc/nginx/sites-available";
    this.nginxEnabledPath =
      this.configService.get("NGINX_ENABLED_PATH") ||
      "/etc/nginx/sites-enabled";
  }

  /**
   * Get server IP for DNS configuration
   */
  getServerIp(): string {
    return this.serverIp;
  }

  /**
   * Get all domains for a service
   */
  async getDomainsForService(
    user: CurrentUserPayload,
    serviceId: string
  ): Promise<DomainDocument[]> {
    // Check service access
    await this.checkServiceAccess(user, serviceId);

    return this.domainModel
      .find({ serviceId: new Types.ObjectId(serviceId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get a single domain by ID
   */
  async getDomain(
    user: CurrentUserPayload,
    domainId: string
  ): Promise<DomainDocument> {
    const domain = await this.domainModel.findById(domainId).exec();

    if (!domain) {
      throw new NotFoundException("Domain not found");
    }

    await this.checkServiceAccess(user, domain.serviceId.toString());

    return domain;
  }

  /**
   * Create a new domain configuration
   */
  async createDomain(
    user: CurrentUserPayload,
    dto: CreateDomainDto
  ): Promise<DomainDocument> {
    // Check service access
    await this.checkServiceAccess(user, dto.serviceId);

    // Validate domain format
    if (!this.isValidDomain(dto.domain)) {
      throw new BadRequestException("Invalid domain format");
    }

    // Check if domain already exists
    const existingDomain = await this.domainModel
      .findOne({ domain: dto.domain.toLowerCase() })
      .exec();

    if (existingDomain) {
      throw new BadRequestException(
        "Domain is already configured for another service"
      );
    }

    // Create domain record
    const domain = new this.domainModel({
      domain: dto.domain.toLowerCase(),
      port: dto.port,
      serviceId: new Types.ObjectId(dto.serviceId),
      createdBy: new Types.ObjectId(user.userId),
      status: "pending" as DomainStatus,
      sslEnabled: false,
    });

    await domain.save();

    this.logger.log(
      `Domain ${dto.domain} created for service ${dto.serviceId}`
    );

    return domain;
  }

  /**
   * Verify DNS configuration for a domain
   * @param skipVerification - Skip DNS check (for Cloudflare/proxy users)
   */
  async verifyDomain(
    user: CurrentUserPayload,
    domainId: string,
    skipVerification: boolean = false
  ): Promise<{
    verified: boolean;
    message: string;
    resolvedIps?: string[];
    isCloudflare?: boolean;
  }> {
    const domain = await this.getDomain(user, domainId);

    // Skip verification mode - for Cloudflare or other proxy users
    if (skipVerification) {
      domain.status = "verified";
      domain.lastCheckedAt = new Date();
      domain.errorMessage = "";
      await domain.save();

      this.logger.log(
        `Domain ${domain.domain} verified (skipped DNS check - Cloudflare/proxy mode)`
      );

      return {
        verified: true,
        message: `Domain ${domain.domain} marked as verified. Make sure your DNS/proxy is correctly configured.`,
      };
    }

    if (!this.serverIp) {
      throw new BadRequestException(
        "Server IP not configured. Set SERVER_IP environment variable."
      );
    }

    try {
      const resolvedIps = await dnsResolve4(domain.domain);

      domain.lastCheckedAt = new Date();

      // Check if it's Cloudflare (common Cloudflare IP ranges)
      const isCloudflare = this.isCloudflareIp(resolvedIps);

      if (resolvedIps.includes(this.serverIp)) {
        domain.status = "verified";
        await domain.save();

        this.logger.log(`Domain ${domain.domain} verified successfully`);

        return {
          verified: true,
          message: `Domain ${domain.domain} is correctly pointing to ${this.serverIp}`,
          resolvedIps,
          isCloudflare: false,
        };
      } else if (isCloudflare) {
        // Cloudflare detected - suggest skipping verification
        domain.status = "pending";
        domain.errorMessage = "Cloudflare proxy detected";
        await domain.save();

        return {
          verified: false,
          message: `Cloudflare proxy detected. If you're using Cloudflare, click "Skip & Verify" to proceed. Make sure your domain is proxied correctly in Cloudflare dashboard.`,
          resolvedIps,
          isCloudflare: true,
        };
      } else {
        domain.status = "pending";
        domain.errorMessage = `Domain points to ${resolvedIps.join(", ")} instead of ${this.serverIp}`;
        await domain.save();

        return {
          verified: false,
          message: `Domain points to ${resolvedIps.join(", ")} instead of ${this.serverIp}. Please update your DNS A record.`,
          resolvedIps,
          isCloudflare: false,
        };
      }
    } catch (error) {
      domain.status = "pending";
      domain.lastCheckedAt = new Date();
      domain.errorMessage = `DNS lookup failed: ${error.message}`;
      await domain.save();

      return {
        verified: false,
        message: `DNS lookup failed. Make sure the domain has an A record pointing to ${this.serverIp}`,
        isCloudflare: false,
      };
    }
  }

  /**
   * Check if IPs belong to Cloudflare
   */
  private isCloudflareIp(ips: string[]): boolean {
    // Common Cloudflare IP prefixes
    const cloudflareRanges = [
      "103.21.",
      "103.22.",
      "103.31.",
      "104.16.",
      "104.17.",
      "104.18.",
      "104.19.",
      "104.20.",
      "104.21.",
      "104.22.",
      "104.23.",
      "104.24.",
      "104.25.",
      "104.26.",
      "104.27.",
      "108.162.",
      "131.0.",
      "141.101.",
      "162.158.",
      "172.64.",
      "172.65.",
      "172.66.",
      "172.67.",
      "172.68.",
      "172.69.",
      "172.70.",
      "172.71.",
      "173.245.",
      "188.114.",
      "190.93.",
      "197.234.",
      "198.41.",
    ];

    return ips.some((ip) =>
      cloudflareRanges.some((range) => ip.startsWith(range))
    );
  }

  /**
   * Activate domain - create nginx config and setup SSL
   */
  async activateDomain(
    user: CurrentUserPayload,
    domainId: string
  ): Promise<{ success: boolean; message: string }> {
    const domain = await this.getDomain(user, domainId);

    if (domain.status !== "verified") {
      throw new BadRequestException(
        "Domain must be verified before activation. Please verify DNS configuration first."
      );
    }

    try {
      // Create nginx configuration
      await this.createNginxConfig(domain);

      // Enable nginx site
      await this.enableNginxSite(domain);

      // Reload nginx
      await this.reloadNginx();

      // Setup SSL with certbot
      await this.setupSsl(domain);

      // Update domain status
      domain.status = "active";
      domain.sslEnabled = true;
      domain.activatedAt = new Date();
      domain.nginxConfigPath = path.join(
        this.nginxAvailablePath,
        `${domain.domain}.conf`
      );
      domain.errorMessage = "";
      await domain.save();

      this.logger.log(`Domain ${domain.domain} activated with SSL`);

      return {
        success: true,
        message: `Domain ${domain.domain} is now active with SSL enabled`,
      };
    } catch (error) {
      domain.status = "error";
      domain.errorMessage = error.message;
      await domain.save();

      this.logger.error(
        `Failed to activate domain ${domain.domain}: ${error.message}`
      );

      throw new BadRequestException(
        `Failed to activate domain: ${error.message}`
      );
    }
  }

  /**
   * Delete a domain and its nginx configuration
   */
  async deleteDomain(
    user: CurrentUserPayload,
    domainId: string
  ): Promise<{ success: boolean }> {
    const domain = await this.getDomain(user, domainId);

    // Remove nginx configuration if exists
    if (domain.status === "active") {
      try {
        await this.removeNginxConfig(domain);
      } catch (error) {
        this.logger.warn(
          `Failed to remove nginx config for ${domain.domain}: ${error.message}`
        );
      }
    }

    await this.domainModel.findByIdAndDelete(domainId).exec();

    this.logger.log(`Domain ${domain.domain} deleted`);

    return { success: true };
  }

  /**
   * Delete all domains for a service
   */
  async deleteDomainsForService(serviceId: string): Promise<void> {
    const domains = await this.domainModel
      .find({ serviceId: new Types.ObjectId(serviceId) })
      .exec();

    for (const domain of domains) {
      if (domain.status === "active") {
        try {
          await this.removeNginxConfig(domain);
        } catch (error) {
          this.logger.warn(
            `Failed to remove nginx config for ${domain.domain}: ${error.message}`
          );
        }
      }
    }

    await this.domainModel
      .deleteMany({ serviceId: new Types.ObjectId(serviceId) })
      .exec();

    this.logger.log(`All domains deleted for service ${serviceId}`);
  }

  // ==================== Private Methods ====================

  private async checkServiceAccess(
    user: CurrentUserPayload,
    serviceId: string
  ): Promise<void> {
    const service = await this.serviceModel.findById(serviceId).exec();

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const isOwner = service.createdBy?.toString() === user.userId;
    const isPublic = service.visibility === "public";
    const isAdmin = user.role === "admin";

    if (!isOwner && !isPublic && !isAdmin) {
      throw new ForbiddenException(
        "You do not have permission to access this service"
      );
    }
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex =
      /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;
    return domainRegex.test(domain);
  }

  private async createNginxConfig(domain: DomainDocument): Promise<void> {
    const configContent = `server {
    listen 80;
    server_name ${domain.domain};

    location / {
        proxy_pass http://localhost:${domain.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

    const configPath = path.join(
      this.nginxAvailablePath,
      `${domain.domain}.conf`
    );

    // Write config file using sudo
    const tempPath = `/tmp/${domain.domain}.conf`;
    fs.writeFileSync(tempPath, configContent);

    await execAsync(`sudo mv ${tempPath} ${configPath}`);
    await execAsync(`sudo chown root:root ${configPath}`);
    await execAsync(`sudo chmod 644 ${configPath}`);

    this.logger.log(`Nginx config created at ${configPath}`);
  }

  private async enableNginxSite(domain: DomainDocument): Promise<void> {
    const configPath = path.join(
      this.nginxAvailablePath,
      `${domain.domain}.conf`
    );
    const enabledPath = path.join(
      this.nginxEnabledPath,
      `${domain.domain}.conf`
    );

    await execAsync(`sudo ln -sf ${configPath} ${enabledPath}`);

    this.logger.log(`Nginx site enabled: ${enabledPath}`);
  }

  private async reloadNginx(): Promise<void> {
    // Test nginx configuration first
    const { stderr: testError } = await execAsync("sudo nginx -t");
    if (testError && testError.includes("failed")) {
      throw new Error(`Nginx configuration test failed: ${testError}`);
    }

    await execAsync("sudo systemctl reload nginx");

    this.logger.log("Nginx reloaded");
  }

  private async setupSsl(domain: DomainDocument): Promise<void> {
    const adminEmail =
      this.configService.get("CERTBOT_EMAIL") || `admin@${domain.domain}`;

    try {
      const { stdout, stderr } = await execAsync(
        `sudo certbot --nginx -d ${domain.domain} --non-interactive --agree-tos -m ${adminEmail}`
      );

      if (stderr && stderr.includes("error")) {
        throw new Error(stderr);
      }

      this.logger.log(`SSL certificate obtained for ${domain.domain}`);
    } catch (error) {
      throw new Error(
        `Failed to obtain SSL certificate: ${error.message}. Make sure Certbot is installed and the domain DNS is properly configured.`
      );
    }
  }

  private async removeNginxConfig(domain: DomainDocument): Promise<void> {
    const configPath = path.join(
      this.nginxAvailablePath,
      `${domain.domain}.conf`
    );
    const enabledPath = path.join(
      this.nginxEnabledPath,
      `${domain.domain}.conf`
    );

    try {
      // Remove enabled symlink
      await execAsync(`sudo rm -f ${enabledPath}`);

      // Remove config file
      await execAsync(`sudo rm -f ${configPath}`);

      // Reload nginx
      await this.reloadNginx();

      this.logger.log(`Nginx config removed for ${domain.domain}`);
    } catch (error) {
      this.logger.warn(
        `Error removing nginx config for ${domain.domain}: ${error.message}`
      );
    }
  }
}
