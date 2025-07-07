import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getFileTypeIcon, getFileTypeColor, getStatusColor, formatFileSize } from "@/lib/file-utils";
import type { File } from "@shared/schema";

interface FileQueueProps {
  onFileSelect: (file: File) => void;
  selectedFileId?: number;
}

export default function FileQueue({ onFileSelect, selectedFileId }: FileQueueProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery<File[]>({
    queryKey: ['/api/files'],
    refetchInterval: 2000, // Poll every 2 seconds for status updates
  });

  const retryMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest('PATCH', `/api/files/${fileId}/status`, {
        status: 'processing'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Retry initiated",
        description: "File processing has been restarted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Retry failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest('DELETE', `/api/files/${fileId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "File has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing with AutoCAD viewer...";
      case "ready":
        return "Ready to view";
      case "error":
        return "Processing failed";
      default:
        return "Unknown status";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "uploading":
        return "bg-blue-50 border-blue-200";
      case "processing":
        return "bg-amber-50 border-amber-200";
      case "ready":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">File Queue</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">File Queue</h3>
      
      {files.length === 0 ? (
        <div className="text-center py-8">
          <i className="fas fa-folder-open text-gray-400 text-3xl mb-2"></i>
          <p className="text-gray-500">No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                getStatusBgColor(file.status)
              } ${selectedFileId === file.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => file.status === 'ready' && onFileSelect(file)}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <i className={`${getFileTypeIcon(file.fileType)} ${getFileTypeColor(file.fileType)}`}></i>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {file.originalName}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className={`text-xs ${getStatusColor(file.status)}`}>
                      {getStatusMessage(file.status)}
                    </p>
                    <span className="text-xs text-gray-500">• {formatFileSize(file.size)}</span>
                  </div>
                  {file.errorMessage && (
                    <p className="text-xs text-red-600 mt-1">{file.errorMessage}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-2">
                {file.status === "processing" && (
                  <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                )}
                
                {file.status === "ready" && (
                  <button 
                    className="text-green-600 hover:text-green-700 text-xs font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileSelect(file);
                    }}
                  >
                    View <i className="fas fa-external-link-alt ml-1"></i>
                  </button>
                )}
                
                {file.status === "error" && (
                  <button
                    className="text-red-600 hover:text-red-700 text-xs font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      retryMutation.mutate(file.id);
                    }}
                    disabled={retryMutation.isPending}
                  >
                    Retry
                  </button>
                )}

                <button
                  className="text-gray-400 hover:text-red-600 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(file.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
