export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
};

export type ApiResult<T> =
  | {
      success: true;
      data: T;
      error: null;
    }
  | {
      success: false;
      data: null;
      error: ApiError;
    };

export type ProjectCreateData = {
  id: number;
  accessToken: string;
};

export type ImageGenerationData = {
  id: number;
  imageUrl: string;
  model: string;
  prompt: string;
  generatedAt: string;
};

export type GridCell = {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GridInfo = {
  rows: number;
  cols: number;
  imageWidth: number;
  imageHeight: number;
  cellWidth: number;
  cellHeight: number;
};

export type AssetSheetGenerationData = {
  id: number;
  assetSheetUrl: string;
  model: string;
  prompt: string;
  grid: GridInfo;
  generatedAt: string;
};

export type GridSplitData = {
  imageUrl: string;
  grid: GridInfo;
  cells: GridCell[];
};

export type ExportedAsset = {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fileName: string;
  imageUrl: string;
};

export type AssetExportData = {
  projectId: number;
  assets: ExportedAsset[];
  zipUrl: string;
  exportedAt: string;
};
