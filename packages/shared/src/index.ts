// Service environment types
export interface Environment {
  name: string;
  description?: string;
  variables: Record<string, string>;
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
  status?: "online" | "stopped" | "errored" | "unknown";
  pm2Id?: number;
  npmArgs?: string;
  npmScript?: string;
  useNpm?: boolean;
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
