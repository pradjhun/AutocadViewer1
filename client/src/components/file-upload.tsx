import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      const response = await apiRequest('POST', '/api/files/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `${data.files.length} file(s) uploaded and processing started`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFiles = useCallback((files: FileList) => {
    if (files.length === 0) return;
    
    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Files must be smaller than 50MB`,
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(files);
  }, [uploadMutation, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Files</h2>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-slate-300 hover:border-blue-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="space-y-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <i className="fas fa-cloud-upload-alt text-blue-600 text-xl"></i>
          </div>
          <div>
            <p className="text-slate-900 font-medium">
              {uploadMutation.isPending ? 'Uploading...' : 'Drop files here or click to browse'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Supports AutoCAD files (.dwg, .dxf, .dwt) and other formats
            </p>
          </div>
          <input
            type="file"
            id="file-input"
            multiple
            className="hidden"
            accept=".dwg,.dxf,.dwt,.pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            disabled={uploadMutation.isPending}
          />
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3 flex items-center">
        <i className="fas fa-info-circle mr-1"></i>
        Maximum file size: 50MB per file
      </p>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Supported File Types</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
            <i className="fas fa-drafting-compass text-blue-600"></i>
            <span className="text-sm font-medium text-blue-700">AutoCAD (.dwg)</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
            <i className="fas fa-vector-square text-blue-600"></i>
            <span className="text-sm font-medium text-blue-700">DXF (.dxf)</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
            <i className="fas fa-file-pdf text-green-600"></i>
            <span className="text-sm font-medium text-green-700">PDF</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg">
            <i className="fas fa-image text-purple-600"></i>
            <span className="text-sm font-medium text-purple-700">Images</span>
          </div>
        </div>
      </div>
    </div>
  );
}
