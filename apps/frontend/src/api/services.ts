import { PM2Service, Environment } from "@pm2-dashboard/shared";
import { ServiceMetrics } from "./pm2";
import { apiGet, apiPost, apiPut, apiDelete } from "./client";

export async function getServices(): Promise<PM2Service[]> {
  return apiGet<PM2Service[]>("/services");
}

export async function getService(id: string): Promise<PM2Service> {
  return apiGet<PM2Service>(`/services/${id}`);
}

export async function createService(
  service: Omit<PM2Service, "_id">
): Promise<PM2Service> {
  return apiPost<PM2Service>("/services", service);
}

export async function updateService(
  id: string,
  service: Partial<PM2Service>
): Promise<PM2Service> {
  return apiPut<PM2Service>(`/services/${id}`, service);
}

export async function deleteService(id: string): Promise<void> {
  return apiDelete(`/services/${id}`);
}

export async function startService(id: string): Promise<void> {
  return apiPost(`/services/${id}/start`);
}

export async function stopService(id: string): Promise<void> {
  return apiPost(`/services/${id}/stop`);
}

export async function restartService(id: string): Promise<void> {
  return apiPost(`/services/${id}/restart`);
}

export async function reloadService(id: string): Promise<void> {
  return apiPost(`/services/${id}/reload`);
}

export async function addEnvironment(
  serviceId: string,
  environment: Omit<Environment, "id">
): Promise<Environment> {
  return apiPost<Environment>(
    `/services/${serviceId}/environments`,
    environment
  );
}

export async function updateEnvironment(
  serviceId: string,
  environmentId: string,
  environment: Partial<Environment>
): Promise<Environment> {
  return apiPut<Environment>(
    `/services/${serviceId}/environments/${environmentId}`,
    environment
  );
}

export async function deleteEnvironment(
  serviceId: string,
  environmentId: string
): Promise<void> {
  return apiDelete(`/services/${serviceId}/environments/${environmentId}`);
}

export async function setActiveEnvironment(
  serviceId: string,
  environmentId: string
): Promise<void> {
  return apiPost(
    `/services/${serviceId}/environments/${environmentId}/activate`
  );
}

export const getServiceMetrics = async (
  serviceId: string
): Promise<ServiceMetrics> => {
  return apiGet<ServiceMetrics>(`/services/${serviceId}/metrics`);
};

export const getServiceLogs = async (
  serviceId: string,
  lines: number = 100
): Promise<{ logs: string }> => {
  return apiGet<{ logs: string }>(`/services/${serviceId}/logs?lines=${lines}`);
};

export const getNodeVersions = async (): Promise<string[]> => {
  return apiGet<string[]>("/services/node/versions");
};
