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
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
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

