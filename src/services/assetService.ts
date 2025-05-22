// services/assetService.ts
import { get, post, put, patch, del } from "../utils/api";

export interface Asset {
  id: number;
  title: string;
  description: string;
  author: string;
  fileName: string;
  preRequisites: string;
  source: string;
  assetURL: string;
  documentationURL: string;
  likeCount: number;
  dislikeCount: number;
  isLongRunning: boolean;
  isUseCase: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  userId: number;
  typeId: number;
  status: string;
  preRequisiteAssetIds?: number[];
}

// GET assets/usecases
export async function fetchUseCases(): Promise<Asset[]> {
  return get<Asset[]>("/assets", { isUseCase: true });
}

// GET assets by usecase id
export async function fetchAssetsByUseCase(
  preRequisiteAssetIds: number[]
): Promise<Asset[]> {
  if (!preRequisiteAssetIds || preRequisiteAssetIds.length === 0) {
    return [];
  }

  // Fetch all prerequisite assets in parallel
  const prerequisiteAssets = await Promise.all(
    preRequisiteAssetIds.map((id) => fetchAssetById(id))
  );

  return prerequisiteAssets;
}

// POST new asset
export async function createAsset(data: { name: string }): Promise<Asset> {
  return post<Asset>("/assets", data);
}

// GET single asset
export async function fetchAssetById(id: number): Promise<Asset> {
  return get<Asset>(`/assets/${id}`);
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

export type PreRequisites = {
  fields: { type: string; name: string }[];
  installDependencyCommands: string[];
};

export function parsePreRequisites(input: string): PreRequisites | null {
  try {
    // First parse the outer JSON string (if it's embedded like a field of an object)
    const parsed = JSON.parse(input);

    // If the result is a string (i.e., double-stringified), parse again
    if (typeof parsed === "string") {
      return JSON.parse(parsed) as PreRequisites;
    }

    // If it's already an object, return it
    return parsed as PreRequisites;
  } catch (err) {
    return null;
  }
}

// Function to get the curl command or later any other command line command to run from the input parameters
export function getCommandToRun(
  taskid: number,
  assetId: number,
  args?: Record<string, string>
): string {
  const data = {
    assetParams: args,
    selectedAssetIds: [assetId],
  };
  const curl = `curl 'http://localhost:5007/api/act-on-assets' --data-raw '${JSON.stringify(
    data
  )}'`;
  console.log(curl);
  return curl;
}
