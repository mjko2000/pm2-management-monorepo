const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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

export interface ServiceMetrics {
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
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
