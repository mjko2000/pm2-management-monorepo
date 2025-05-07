import { PM2Service, Environment } from "@pm2-dashboard/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
console.log(import.meta.env);
export async function getServices(): Promise<PM2Service[]> {
  const response = await fetch(`${API_URL}/services`);
  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }
  return response.json();
}

export async function getService(id: string): Promise<PM2Service> {
  const response = await fetch(`${API_URL}/services/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch service");
  }
  return response.json();
}

export async function createService(
  service: Omit<PM2Service, "_id">
): Promise<PM2Service> {
  const response = await fetch(`${API_URL}/services`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(service),
  });

  if (!response.ok) {
    throw new Error("Failed to create service");
  }

  return response.json();
}

export async function updateService(
  id: string,
  service: Partial<PM2Service>
): Promise<PM2Service> {
  const response = await fetch(`${API_URL}/services/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(service),
  });

  if (!response.ok) {
    throw new Error("Failed to update service");
  }

  return response.json();
}

export async function deleteService(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/services/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete service");
  }
}

export async function startService(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/services/${id}/start`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to start service");
  }
}

export async function stopService(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/services/${id}/stop`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to stop service");
  }
}

export async function restartService(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/services/${id}/restart`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to restart service");
  }
}

export async function addEnvironment(
  serviceId: string,
  environment: Omit<Environment, "id">
): Promise<Environment> {
  const response = await fetch(
    `${API_URL}/services/${serviceId}/environments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(environment),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add environment");
  }

  return response.json();
}

export async function updateEnvironment(
  serviceId: string,
  environmentId: string,
  environment: Partial<Environment>
): Promise<Environment> {
  const response = await fetch(
    `${API_URL}/services/${serviceId}/environments/${environmentId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(environment),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update environment");
  }

  return response.json();
}

export async function deleteEnvironment(
  serviceId: string,
  environmentId: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/services/${serviceId}/environments/${environmentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete environment");
  }
}

export async function setActiveEnvironment(
  serviceId: string,
  environmentId: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/services/${serviceId}/environments/${environmentId}/activate`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to set active environment");
  }
}
