// utils/api.ts
import apiClient from "./apiClient";

export async function get<T>(url: string, params?: object): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

export async function post<T>(url: string, data?: object): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function put<T>(url: string, data?: object): Promise<T> {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

export async function patch<T>(url: string, data?: object): Promise<T> {
  const response = await apiClient.patch<T>(url, data);
  return response.data;
}

export async function del<T>(url: string): Promise<T> {
  const response = await apiClient.delete<T>(url);
  return response.data;
}
