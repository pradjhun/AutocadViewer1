import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import FileUpload from "@/components/file-upload";
import FileQueue from "@/components/file-queue";
import FileViewer from "@/components/file-viewer";
import type { File } from "@shared/schema";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();

  const { data: files = [] } = useQuery<File[]>({
    queryKey: ['/api/files'],
    refetchInterval: 5000,
  });

  // Calculate stats
  const activeFiles = files.filter(f => f.status === 'ready').length;
  const processingFiles = files.filter(f => f.status === 'processing' || f.status === 'uploading').length;
  const completedFiles = files.filter(f => f.status === 'ready').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1 space-y-6">
            <FileUpload />
            <FileQueue 
              onFileSelect={setSelectedFile} 
              selectedFileId={selectedFile?.id}
            />
          </div>
          
          {/* Viewer Section */}
          <div className="lg:col-span-2 space-y-6">
            <FileViewer file={selectedFile} />
            
            {/* Processing Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Active Files</p>
                    <p className="text-2xl font-bold text-blue-600">{activeFiles}</p>
                  </div>
                  <i className="fas fa-file-alt text-blue-600 text-xl"></i>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Processing</p>
                    <p className="text-2xl font-bold text-amber-600">{processingFiles}</p>
                  </div>
                  <i className={`fas fa-cog text-amber-600 text-xl ${processingFiles > 0 ? 'fa-spin' : ''}`}></i>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{completedFiles}</p>
                  </div>
                  <i className="fas fa-check-circle text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
