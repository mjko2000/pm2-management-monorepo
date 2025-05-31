import { SystemMetrics } from "@pm2-dashboard/shared";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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
  const response = await fetch(`${API_URL}/services/metrics/system`);
  if (!response.ok) {
    throw new Error("Failed to fetch system metrics");
  }
  return response.json();
};

export const getServiceMetrics = async (
  serviceId: string
): Promise<ServiceMetrics> => {
  const response = await fetch(`${API_URL}/services/${serviceId}/metrics`);
  if (!response.ok) {
    throw new Error("Failed to fetch service metrics");
  }
  return response.json();
};
