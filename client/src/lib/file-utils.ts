import { FILE_TYPES } from "@shared/schema";

export const getFileTypeIcon = (fileType: string) => {
  switch (fileType) {
    case FILE_TYPES.AUTOCAD:
      return "fas fa-drafting-compass";
    case FILE_TYPES.PDF:
      return "fas fa-file-pdf";
    case FILE_TYPES.IMAGE:
      return "fas fa-image";
    case FILE_TYPES.DOCUMENT:
      return "fas fa-file-alt";
    default:
      return "fas fa-file";
  }
};

export const getFileTypeColor = (fileType: string) => {
  switch (fileType) {
    case FILE_TYPES.AUTOCAD:
      return "text-blue-600";
    case FILE_TYPES.PDF:
      return "text-green-600";
    case FILE_TYPES.IMAGE:
      return "text-purple-600";
    case FILE_TYPES.DOCUMENT:
      return "text-gray-600";
    default:
      return "text-gray-500";
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "uploading":
      return "text-blue-600";
    case "processing":
      return "text-amber-600";
    case "ready":
      return "text-green-600";
    case "error":
      return "text-red-600";
    default:
      return "text-gray-500";
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const isCADFile = (filename: string): boolean => {
  const ext = filename.toLowerCase().split('.').pop();
  return ['dwg', 'dxf', 'dwt'].includes(ext || '');
};
