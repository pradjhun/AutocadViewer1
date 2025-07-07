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
            <button 
              onClick={() => window.open(`/api/files/${file.id}/download`, '_blank')}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Download File"
            >
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
  const [showLayers, setShowLayers] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [viewerInitialized, setViewerInitialized] = useState(false);
  const [apsToken, setApsToken] = useState<string | null>(null);
  const [currentViewer, setCurrentViewer] = useState<any>(null);
  
  const metadata = file.metadata ? JSON.parse(file.metadata) : {};
  const isApsFile = metadata.viewerType === 'aps' && metadata.urn;
  
  // Reset viewer when file changes
  useEffect(() => {
    if (currentViewer) {
      currentViewer.finish();
      setCurrentViewer(null);
      setViewerInitialized(false);
      
      // Clear the viewer container
      const htmlDiv = document.getElementById('aps-viewer');
      if (htmlDiv) {
        htmlDiv.innerHTML = '';
      }
    }
  }, [file.id]); // Reset when file changes
  
  // Initialize APS Viewer for real AutoCAD files
  useEffect(() => {
    if (isApsFile && ready && !viewerInitialized && !currentViewer) {
      initializeAPSViewer();
    }
  }, [isApsFile, ready, viewerInitialized, currentViewer, file.id]);

  const initializeAPSViewer = async () => {
    try {
      // Get APS token
      const tokenResponse = await fetch('/api/aps/token');
      const tokenData = await tokenResponse.json();
      setApsToken(tokenData.access_token);

      // Load Autodesk Viewer SDK
      if (!(window as any).Autodesk) {
        const script = document.createElement('script');
        script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
        script.onload = () => initViewer(tokenData.access_token);
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
        document.head.appendChild(link);
      } else {
        initViewer(tokenData.access_token);
      }
    } catch (error) {
      console.error('Failed to initialize APS viewer:', error);
    }
  };

  const initViewer = (token: string) => {
    const options = {
      env: 'AutodeskProduction',
      api: 'derivativeV2',
      getAccessToken: (callback: (token: string, expire: number) => void) => {
        callback(token, 3600);
      }
    };

    (window as any).Autodesk.Viewing.Initializer(options, () => {
      const htmlDiv = document.getElementById('aps-viewer');
      if (htmlDiv) {
        // Clear any existing content
        htmlDiv.innerHTML = '';
        
        const viewer = new (window as any).Autodesk.Viewing.GuiViewer3D(htmlDiv);
        const startedCode = viewer.start();
        if (startedCode > 0) {
          console.error('Failed to create a Viewer: WebGL not supported.');
          return;
        }

        // Store the viewer instance
        setCurrentViewer(viewer);

        const documentId = 'urn:' + metadata.urn;
        console.log('Loading document with URN:', documentId);
        
        (window as any).Autodesk.Viewing.Document.load(documentId, (doc: any) => {
          const viewables = doc.getRoot().getDefaultGeometry();
          viewer.loadDocumentNode(doc, viewables);
          setViewerInitialized(true);
          console.log('Successfully loaded document:', file.originalName);
        }, (errorMsg: string) => {
          console.error('Document load error for', file.originalName, ':', errorMsg);
        });
      }
    });
  };

  if (!ready) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-drafting-compass text-white text-2xl animate-spin"></i>
          </div>
          <h4 className="text-white font-semibold mb-2">AutoCAD Viewer Loading...</h4>
          <p className="text-slate-300 text-sm">
            {isApsFile ? 'Processing with Autodesk Platform Services...' : 'Initializing 3D rendering engine'}
          </p>
          <div className="w-48 bg-slate-700 rounded-full h-2 mx-auto mt-4">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (isApsFile) {
    // Real APS Viewer
    return (
      <div className="w-full h-full bg-slate-900 relative">
        <div 
          id="aps-viewer" 
          key={file.id} 
          className="w-full h-full"
        ></div>
        
        {/* File Info Overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-sm z-10">
          <div className="mb-2">
            <span className="text-blue-400 font-semibold">{file.originalName}</span>
          </div>
          <div className="space-y-1 text-xs">
            <div>Status: {metadata.status || 'Processing'}</div>
            <div>URN: {metadata.urn ? metadata.urn.substring(0, 20) + '...' : 'Processing'}</div>
            <div>Viewer: Autodesk Platform Services</div>
          </div>
        </div>

        {!viewerInitialized && (
          <div className="absolute inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-drafting-compass text-white text-2xl animate-spin"></i>
              </div>
              <h4 className="font-semibold mb-2">Loading Autodesk Viewer...</h4>
              <p className="text-sm">Initializing real CAD file viewer</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback simulated viewer
  return (
    <div className="w-full h-full bg-slate-900 relative overflow-hidden">
      {/* Main Drawing Canvas */}
      <div className="w-full h-full relative">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
        
        {/* Simulated CAD Drawing */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="400" height="300" className="border border-gray-600 bg-slate-800 rounded">
            {/* Sample CAD elements */}
            <rect x="50" y="50" width="150" height="100" fill="none" stroke="#00ff00" strokeWidth="2"/>
            <rect x="250" y="100" width="100" height="80" fill="none" stroke="#00ff00" strokeWidth="2"/>
            <line x1="50" y1="50" x2="250" y2="100" stroke="#ffff00" strokeWidth="1"/>
            <line x1="200" y1="50" x2="350" y2="100" stroke="#ffff00" strokeWidth="1"/>
            <circle cx="125" cy="100" r="20" fill="none" stroke="#ff0000" strokeWidth="2"/>
            <circle cx="300" cy="140" r="15" fill="none" stroke="#ff0000" strokeWidth="2"/>
            <text x="60" y="40" fill="#ffffff" fontSize="10">PLAN VIEW</text>
            <text x="260" y="90" fill="#ffffff" fontSize="10">DETAIL A</text>
            
            {/* Dimension lines */}
            <line x1="50" y1="170" x2="200" y2="170" stroke="#cyan" strokeWidth="1"/>
            <line x1="50" y1="165" x2="50" y2="175" stroke="#cyan" strokeWidth="1"/>
            <line x1="200" y1="165" x2="200" y2="175" stroke="#cyan" strokeWidth="1"/>
            <text x="115" y="185" fill="#cyan" fontSize="8">150.00</text>
          </svg>
        </div>

        {/* File Info Overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white p-3 rounded-lg text-sm">
          <div className="mb-2">
            <span className="text-blue-400 font-semibold">{file.originalName}</span>
          </div>
          <div className="space-y-1 text-xs">
            <div>Entities: {metadata.entities || 'Unknown'}</div>
            <div>Blocks: {metadata.blocks || 'Unknown'}</div>
            <div>Units: {metadata.units || 'Unknown'}</div>
            <div>Zoom: {zoom}%</div>
          </div>
        </div>
      </div>

      {/* Viewer Controls */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
        <button 
          onClick={() => setZoom(Math.min(200, zoom + 25))}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 p-2 rounded-lg shadow-lg transition-all"
          title="Zoom In"
        >
          <i className="fas fa-search-plus"></i>
        </button>
        <button 
          onClick={() => setZoom(Math.max(25, zoom - 25))}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 p-2 rounded-lg shadow-lg transition-all"
          title="Zoom Out"
        >
          <i className="fas fa-search-minus"></i>
        </button>
        <button 
          onClick={() => setZoom(100)}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 p-2 rounded-lg shadow-lg transition-all"
          title="Zoom to Fit"
        >
          <i className="fas fa-home"></i>
        </button>
        <button className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 p-2 rounded-lg shadow-lg transition-all"
          title="3D View"
        >
          <i className="fas fa-cube"></i>
        </button>
      </div>

      {/* Layer Panel Toggle */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={() => setShowLayers(!showLayers)}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 px-3 py-2 rounded-lg shadow-lg transition-all text-sm font-medium"
        >
          <i className="fas fa-layer-group mr-2"></i>
          Layers
        </button>
      </div>

      {/* Layer Panel */}
      {showLayers && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-xl p-4 w-64">
          <h4 className="font-semibold mb-3">Drawing Layers</h4>
          <div className="space-y-2">
            {(metadata.layers || ['0', 'DIMENSION', 'TEXT']).map((layer: string, index: number) => (
              <div key={layer} className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <div className={`w-3 h-3 rounded ${
                  index === 0 ? 'bg-green-500' : 
                  index === 1 ? 'bg-yellow-500' : 
                  index === 2 ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <span className="text-sm">{layer}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-800 text-white p-2 text-xs flex justify-between">
        <div>Ready - {metadata.version || 'AutoCAD Compatible'}</div>
        <div>Model Space | {metadata.units || 'Units'}</div>
      </div>
    </div>
  );
}

function PDFViewer({ file }: { file: File }) {
  return (
    <div className="w-full h-full bg-gray-100 relative">
      {/* PDF Viewer Header */}
      <div className="absolute top-0 left-0 right-0 bg-red-600 text-white p-2 text-sm">
        <div className="flex items-center justify-between">
          <span>PDF Document - {file.originalName}</span>
          <div className="flex space-x-2">
            <button className="hover:bg-red-700 px-2 py-1 rounded">Print</button>
            <button className="hover:bg-red-700 px-2 py-1 rounded">Download</button>
          </div>
        </div>
      </div>
      
      {/* Simulated PDF Content */}
      <div className="pt-10 h-full overflow-auto bg-gray-200 p-4">
        <div className="max-w-2xl mx-auto bg-white shadow-lg">
          <div className="p-8 min-h-96">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Document Title</h1>
              <p className="text-gray-600">Technical Drawing Specifications</p>
            </div>
            
            <div className="space-y-4 text-justify">
              <p className="text-sm leading-relaxed">
                This document contains technical specifications and detailed drawings for the project. 
                The content includes dimensional tolerances, material specifications, and assembly instructions.
              </p>
              
              <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-3">
                <p className="text-sm font-semibold">Note:</p>
                <p className="text-sm">All dimensions are in millimeters unless otherwise specified.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-100 p-4 rounded">
                  <h3 className="font-semibold mb-2">Specifications</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Material: Steel</li>
                    <li>• Tolerance: ±0.1mm</li>
                    <li>• Surface finish: Ra 3.2</li>
                  </ul>
                </div>
                <div className="bg-gray-100 p-4 rounded">
                  <h3 className="font-semibold mb-2">Revision History</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Rev A: Initial release</li>
                    <li>• Rev B: Updated dimensions</li>
                    <li>• Rev C: Current version</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* PDF Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-2 flex items-center space-x-2">
        <button className="p-2 hover:bg-gray-100 rounded">
          <i className="fas fa-chevron-up"></i>
        </button>
        <span className="text-sm px-2">Page 1 of 1</span>
        <button className="p-2 hover:bg-gray-100 rounded">
          <i className="fas fa-chevron-down"></i>
        </button>
        <div className="border-l pl-2 ml-2">
          <button className="p-2 hover:bg-gray-100 rounded">
            <i className="fas fa-search-minus"></i>
          </button>
          <span className="text-sm px-2">100%</span>
          <button className="p-2 hover:bg-gray-100 rounded">
            <i className="fas fa-search-plus"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageViewer({ file }: { file: File }) {
  const [zoom, setZoom] = useState(100);
  
  return (
    <div className="w-full h-full bg-gray-900 relative">
      {/* Image Header */}
      <div className="absolute top-0 left-0 right-0 bg-purple-600 text-white p-2 text-sm z-10">
        <div className="flex items-center justify-between">
          <span>Image Viewer - {file.originalName}</span>
          <div className="flex space-x-2">
            <button className="hover:bg-purple-700 px-2 py-1 rounded">Fullscreen</button>
            <button className="hover:bg-purple-700 px-2 py-1 rounded">Download</button>
          </div>
        </div>
      </div>
      
      {/* Image Content */}
      <div className="pt-10 h-full flex items-center justify-center p-4">
        <div className="bg-white border border-gray-300 rounded-lg p-4 max-w-4xl shadow-lg">
          {/* Simulated Image */}
          <div className="relative">
            <svg width="600" height="400" className="border border-gray-200 rounded">
              {/* Simulated photograph/image content */}
              <defs>
                <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#87CEEB', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#98FB98', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              
              {/* Sky background */}
              <rect width="600" height="200" fill="url(#skyGradient)" />
              
              {/* Ground */}
              <rect y="200" width="600" height="200" fill="#90EE90" />
              
              {/* Buildings/structures */}
              <rect x="100" y="150" width="80" height="150" fill="#D3D3D3" />
              <rect x="200" y="120" width="60" height="180" fill="#C0C0C0" />
              <rect x="300" y="140" width="90" height="160" fill="#DCDCDC" />
              
              {/* Some geometric shapes */}
              <circle cx="450" cy="100" r="30" fill="#FFD700" />
              <polygon points="500,180 520,140 540,180" fill="#8B4513" />
              
              {/* Text overlay */}
              <text x="20" y="380" fill="#333" fontSize="14" fontFamily="Arial">
                Sample Image Content - {formatFileSize(file.size)}
              </text>
            </svg>
            
            {/* Image info overlay */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white p-2 rounded text-xs">
              <div>Dimensions: 600 × 400</div>
              <div>Format: {file.mimeType}</div>
              <div>Zoom: {zoom}%</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-2 flex items-center space-x-2">
        <button 
          onClick={() => setZoom(Math.max(25, zoom - 25))}
          className="p-2 hover:bg-gray-100 rounded"
          title="Zoom Out"
        >
          <i className="fas fa-search-minus"></i>
        </button>
        <span className="text-sm px-2">{zoom}%</span>
        <button 
          onClick={() => setZoom(Math.min(200, zoom + 25))}
          className="p-2 hover:bg-gray-100 rounded"
          title="Zoom In"
        >
          <i className="fas fa-search-plus"></i>
        </button>
        <div className="border-l pl-2 ml-2">
          <button 
            onClick={() => setZoom(100)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Fit to Screen"
          >
            <i className="fas fa-expand-arrows-alt"></i>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded" title="Rotate">
            <i className="fas fa-redo"></i>
          </button>
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
