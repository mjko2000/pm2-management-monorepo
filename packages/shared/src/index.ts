// Service environment types
export interface Environment {
  name: string;
  description?: string;
  variables: Record<string, string> | null;
}

// Service status enum
export enum ServiceStatus {
  ONLINE = "online",
  STOPPED = "stopped",
  ERRORED = "errored",
  BUILDING = "building",
  UNKNOWN = "unknown",
}

// GitHub repository interface
export interface Repository {
  id: string;
  name: string;
  fullName: string;
  url: string;
  description?: string;
}

// PM2 service configuration
export interface PM2Service {
  _id: string;
  name: string;
  repositoryUrl: string;
  branch: string;
  sourceDirectory?: string; // In case the service is in a subdirectory
  script: string;
  args?: string;
  environments: Environment[];
  activeEnvironment?: string;
  status?: ServiceStatus;
  pm2AppName?: string; // PM2 app name for managing cluster instances
  npmArgs?: string;
  npmScript?: string;
  useNpm?: boolean;
  nodeVersion?: string;
  repoPath?: string; // Path to the cloned repository on the server
  cluster?: number | null; // null for off, number for cluster instances
}

// GitHub Token Config
export interface GitHubConfig {
  token: string;
  username?: string;
}

// System Configuration
export interface SystemConfig {
  github?: GitHubConfig;
  workingDirectory: string;
}

export interface Log {
  _id: string;
  level: string;
  message: string;
  context?: string;
  trace?: string;
  timestamp: Date;
}
export interface SystemMetrics {
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
  };
  cpu: {
    cores: number;
    usage: Array<{
      model: string;
      speed: number;
      usage: number;
    }>;
  };
}
