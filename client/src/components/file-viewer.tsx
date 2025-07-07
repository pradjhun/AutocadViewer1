import { useState, useEffect } from "react";
import { formatFileSize, isCADFile } from "@/lib/file-utils";
import type { File } from "@shared/schema";

interface FileViewerProps {
  file?: File;
}

export default function FileViewer({ file }: FileViewerProps) {
  const [viewerReady, setViewerReady] = useState(false);

  useEffect(() => {
    if (file && file.fileType === 'autocad') {
      // Simulate AutoCAD viewer initialization
      setViewerReady(false);
      const timer = setTimeout(() => setViewerReady(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [file]);

  if (!file) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-center h-96 text-center">
          <div>
            <i className="fas fa-file-alt text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No file selected</h3>
            <p className="text-gray-500">Upload and select a file to view it here</p>
          </div>
        </div>
      </div>
    );
  }

  const metadata = file.metadata ? JSON.parse(file.metadata) : {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Viewer Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className={`${file.fileType === 'autocad' ? 'fas fa-drafting-compass text-blue-600' : 'fas fa-file text-gray-600'}`}></i>
            <div>
              <h3 className="font-semibold text-slate-900">{file.originalName}</h3>
              <p className="text-sm text-slate-500">
                {file.fileType === 'autocad' ? 'AutoCAD Drawing' : file.mimeType} • {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <i className="fas fa-download"></i>
            </button>
            <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <i className="fas fa-expand-arrows-alt"></i>
            </button>
            <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="relative" style={{ height: '600px' }}>
        {file.fileType === 'autocad' ? (
          <AutoCADViewer file={file} ready={viewerReady} />
        ) : file.fileType === 'pdf' ? (
          <PDFViewer file={file} />
        ) : file.fileType === 'image' ? (
          <ImageViewer file={file} />
        ) : (
          <DefaultViewer file={file} />
        )}
      </div>

      {/* File Information Panel */}
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="block text-slate-500 font-medium">File Size</label>
            <span className="text-slate-900">{formatFileSize(file.size)}</span>
          </div>
          <div>
            <label className="block text-slate-500 font-medium">Type</label>
            <span className="text-slate-900">{file.fileType}</span>
          </div>
          <div>
            <label className="block text-slate-500 font-medium">Status</label>
            <span className="text-slate-900">{file.status}</span>
          </div>
          <div>
            <label className="block text-slate-500 font-medium">Uploaded</label>
            <span className="text-slate-900">
              {new Date(file.uploadedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutoCADViewer({ file, ready }: { file: File; ready: boolean }) {
  if (!ready) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-drafting-compass text-white text-2xl"></i>
          </div>
          <h4 className="text-white font-semibold mb-2">AutoCAD Viewer Loading...</h4>
          <p className="text-slate-300 text-sm">Initializing 3D rendering engine</p>
          <div className="w-48 bg-slate-700 rounded-full h-2 mx-auto mt-4">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-900 relative">
      {/* AutoCAD Viewer would be initialized here */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-drafting-compass text-white text-2xl"></i>
          </div>
          <h4 className="text-white font-semibold mb-2">AutoCAD Viewer Ready</h4>
          <p className="text-slate-300 text-sm">File: {file.originalName}</p>
        </div>
      </div>

      {/* Viewer Controls */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
        <button className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 p-2 rounded-lg shadow-lg transition-all">
          <i className="fas fa-search-plus"></i>
        </button>
        <button className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 p-2 rounded-lg shadow-lg transition-all">
          <i className="fas fa-search-minus"></i>
        </button>
        <button className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 p-2 rounded-lg shadow-lg transition-all">
          <i className="fas fa-home"></i>
        </button>
        <button className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 p-2 rounded-lg shadow-lg transition-all">
          <i className="fas fa-cube"></i>
        </button>
      </div>

      {/* Layer Panel Toggle */}
      <div className="absolute top-4 right-4">
        <button className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 px-3 py-2 rounded-lg shadow-lg transition-all text-sm font-medium">
          <i className="fas fa-layer-group mr-2"></i>
          Layers
        </button>
      </div>
    </div>
  );
}

function PDFViewer({ file }: { file: File }) {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <i className="fas fa-file-pdf text-red-600 text-4xl mb-4"></i>
        <h4 className="font-semibold mb-2">PDF Viewer</h4>
        <p className="text-gray-600 text-sm mb-4">File: {file.originalName}</p>
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
          Open in Browser
        </button>
      </div>
    </div>
  );
}

function ImageViewer({ file }: { file: File }) {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <i className="fas fa-image text-purple-600 text-4xl mb-4"></i>
        <h4 className="font-semibold mb-2">Image Viewer</h4>
        <p className="text-gray-600 text-sm mb-4">File: {file.originalName}</p>
        <div className="bg-white border border-gray-300 rounded-lg p-4 max-w-md">
          <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-500">Image Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultViewer({ file }: { file: File }) {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <i className="fas fa-file text-gray-600 text-4xl mb-4"></i>
        <h4 className="font-semibold mb-2">Standard Viewer</h4>
        <p className="text-gray-600 text-sm mb-4">File: {file.originalName}</p>
        <p className="text-gray-500 text-sm">Use browser default viewer for this file type</p>
      </div>
    </div>
  );
}
