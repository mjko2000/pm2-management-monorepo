export type ServiceVisibility = "private" | "public";
export type PackageManager = "yarn" | "npm" | "pnpm";

export interface PM2Service {
  id: string;
  name: string;
  repositoryUrl: string;
  branch: string;
  sourceDirectory?: string;
  useNpm: boolean;
  npmScript?: string;
  npmArgs?: string;
  script: string;
  args?: string;
  environments: Environment[];
  activeEnvironment?: string;
  status: "online" | "stopped" | "errored";
  pm2Id?: string;
  autostart?: boolean;
  visibility?: ServiceVisibility;
  createdBy?: string;
  packageManager?: PackageManager;
}

export interface Environment {
  name: string;
  description?: string;
  variables: Record<string, string>;
}

export interface ServiceOwner {
  _id: string;
  username: string;
}
