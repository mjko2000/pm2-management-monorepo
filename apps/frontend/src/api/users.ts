import { apiGet, apiPost, apiPut, apiDelete } from "./client";

export interface User {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  mustChangeEmail?: boolean;
  twoFactor?: {
    emailOtpEnabled: boolean;
    totpEnabled: boolean;
  };
}

export interface CreateUserDto {
  username: string;
  email: string;
  password?: string;
  role?: "admin" | "user";
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  role?: "admin" | "user";
  isActive?: boolean;
}

export interface UpdateProfileDto {
  username?: string;
  email?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface FirstLoginSetupDto {
  newPassword: string;
  newEmail: string;
}

export interface Update2faSettingsDto {
  emailOtpEnabled?: boolean;
  totpEnabled?: boolean;
}

export interface TotpSetupResult {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

export async function getUsers(): Promise<User[]> {
  return apiGet<User[]>("/auth/users");
}

export async function createUser(data: CreateUserDto): Promise<User> {
  return apiPost<User>("/auth/users", data);
}

export async function updateUser(id: string, data: UpdateUserDto): Promise<User> {
  return apiPut<User>(`/auth/users/${id}`, data);
}

export async function deleteUser(id: string): Promise<void> {
  return apiDelete(`/auth/users/${id}`);
}

export async function updateProfile(data: UpdateProfileDto): Promise<UserProfile> {
  return apiPut<UserProfile>("/auth/profile", data);
}

export async function changePassword(data: ChangePasswordDto): Promise<void> {
  return apiPost("/auth/change-password", data);
}

export async function completeFirstLogin(data: FirstLoginSetupDto): Promise<{ access_token: string; user: UserProfile }> {
  return apiPost<{ access_token: string; user: UserProfile }>("/auth/first-login/complete", data);
}

export async function setupTotp(): Promise<TotpSetupResult> {
  return apiPost<TotpSetupResult>("/auth/2fa/totp/setup");
}

export async function enableTotp(code: string): Promise<void> {
  return apiPost("/auth/2fa/totp/enable", { code });
}

export async function update2faSettings(data: Update2faSettingsDto): Promise<void> {
  return apiPut("/auth/2fa/settings", data);
}

export async function sendEmailOtp(challengeId: string): Promise<void> {
  return apiPost("/auth/2fa/email/send", { challengeId });
}

export async function verify2fa(data: {
  challengeId: string;
  method: "emailOtp" | "totp";
  code: string;
}): Promise<{ access_token: string; user: UserProfile }> {
  return apiPost<{ access_token: string; user: UserProfile }>("/auth/2fa/verify", data);
}

