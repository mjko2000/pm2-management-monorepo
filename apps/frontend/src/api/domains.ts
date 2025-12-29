import { apiGet, apiPost, apiDelete } from "./client";

export type DomainStatus = "pending" | "verified" | "active" | "error";

export interface Domain {
  _id: string;
  domain: string;
  port: number;
  serviceId: string;
  createdBy: {
    _id: string;
    username: string;
  };
  status: DomainStatus;
  sslEnabled: boolean;
  sslExpiresAt?: string;
  errorMessage?: string;
  nginxConfigPath?: string;
  lastCheckedAt?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDomainDto {
  domain: string;
  port: number;
  serviceId: string;
}

export interface VerifyDomainResponse {
  verified: boolean;
  message: string;
  resolvedIps?: string[];
  isCloudflare?: boolean;
}

export interface ActivateDomainResponse {
  success: boolean;
  message: string;
}

export interface ServerIpResponse {
  serverIp: string;
}

export async function getServerIp(): Promise<ServerIpResponse> {
  return apiGet<ServerIpResponse>("/domains/server-ip");
}

export async function getDomainsForService(
  serviceId: string
): Promise<Domain[]> {
  return apiGet<Domain[]>(`/domains/service/${serviceId}`);
}

export async function getDomain(id: string): Promise<Domain> {
  return apiGet<Domain>(`/domains/${id}`);
}

export async function createDomain(data: CreateDomainDto): Promise<Domain> {
  return apiPost<Domain>("/domains", data);
}

export async function verifyDomain(
  id: string,
  skip: boolean = false
): Promise<VerifyDomainResponse> {
  const query = skip ? "?skip=true" : "";
  return apiPost<VerifyDomainResponse>(`/domains/${id}/verify${query}`);
}

export async function activateDomain(
  id: string
): Promise<ActivateDomainResponse> {
  return apiPost<ActivateDomainResponse>(`/domains/${id}/activate`);
}

export async function deleteDomain(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/domains/${id}`);
}

