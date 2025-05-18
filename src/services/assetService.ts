// services/assetService.ts
import { get, post, put, patch, del } from "../utils/api";

export interface Asset {
  id: string;
  name: string;
}

// GET assets for a specific use case
export async function fetchAssets(): Promise<Asset[]> {
  return get<Asset[]>("/assets", { isUseCase: false });
}

// POST new asset
export async function createAsset(data: { name: string }): Promise<Asset> {
  return post<Asset>("/assets", data);
}

// PUT (full update)
export async function updateAsset(
  id: string,
  data: { name: string }
): Promise<Asset> {
  return put<Asset>(`/assets/${id}`, data);
}

// PATCH (partial update)
export async function patchAsset(
  id: string,
  data: Partial<Asset>
): Promise<Asset> {
  return patch<Asset>(`/assets/${id}`, data);
}

// DELETE asset
export async function deleteAsset(id: string): Promise<{ success: boolean }> {
  return del<{ success: boolean }>(`/assets/${id}`);
}
