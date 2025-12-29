import { SystemMetrics } from "@pm2-dashboard/shared";
import { apiGet } from "./client";

export interface ProcessInfo {
  pid: number;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
}

export interface ServiceMetrics {
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
  instances: number;
  processes?: ProcessInfo[]; // Individual process details for cluster mode
}

export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  return apiGet<SystemMetrics>("/services/metrics/system");
};

export const getServiceMetrics = async (
  serviceId: string
): Promise<ServiceMetrics> => {
  return apiGet<ServiceMetrics>(`/services/${serviceId}/metrics`);
};
