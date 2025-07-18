import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { insertFileSchema, FILE_TYPES, FILE_STATUS } from "@shared/schema";
import { z } from "zod";
import { apsService } from "./aps-service";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types - we'll handle type detection in the route
    cb(null, true);
  }
});

// File type detection based on extension and MIME type
function detectFileType(filename: string, mimeType: string): string {
  const ext = path.extname(filename).toLowerCase();
  
  // AutoCAD files
  if (['.dwg', '.dxf', '.dwt'].includes(ext)) {
    return FILE_TYPES.AUTOCAD;
  }
  
  // PDF files
  if (ext === '.pdf' || mimeType === 'application/pdf') {
    return FILE_TYPES.PDF;
  }
  
  // Image files
  if (ext.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/) || mimeType.startsWith('image/')) {
    return FILE_TYPES.IMAGE;
  }
  
  // Document files
  if (ext.match(/\.(doc|docx|txt|rtf)$/) || mimeType.includes('document') || mimeType.includes('text')) {
    return FILE_TYPES.DOCUMENT;
  }
  
  return FILE_TYPES.OTHER;
}

// Process files with real APS integration for AutoCAD files
async function processFile(fileId: number, fileType: string, filePath: string, originalName: string): Promise<void> {
  try {
    if (fileType === FILE_TYPES.AUTOCAD) {
      await storage.updateFileStatus(fileId, FILE_STATUS.PROCESSING);
      
      // Process with APS
      const bucketKey = `autocad-viewer-${Date.now()}`;
      const objectKey = `${fileId}-${originalName}`;
      
      try {
        // Create bucket
        await apsService.createBucket(bucketKey);
        
        // Upload file to APS
        const uploadResult = await apsService.uploadFile(bucketKey, objectKey, filePath);
        const urn = apsService.encodeBase64Url(uploadResult.objectId);
        
        // Start translation
        await apsService.translateFile(urn);
        
        // Poll for translation status
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max
        
        const checkStatus = async (): Promise<void> => {
          attempts++;
          const status = await apsService.getTranslationStatus(urn);
          
          if (status.status === 'success') {
            await storage.updateFileStatus(fileId, FILE_STATUS.READY);
            await storage.updateFileMetadata(fileId, JSON.stringify({
              viewerType: 'aps',
              urn: urn,
              bucketKey: bucketKey,
              objectKey: objectKey,
              status: 'translated',
              derivatives: status
            }));
          } else if (status.status === 'failed') {
            await storage.updateFileStatus(fileId, FILE_STATUS.ERROR, 'APS translation failed');
          } else if (attempts < maxAttempts) {
            // Still processing, check again in 10 seconds
            setTimeout(checkStatus, 10000);
          } else {
            await storage.updateFileStatus(fileId, FILE_STATUS.ERROR, 'Translation timeout');
          }
        };
        
        // Start checking status after 10 seconds
        setTimeout(checkStatus, 10000);
        
      } catch (apsError: any) {
        console.error('APS processing error:', apsError);
        await storage.updateFileStatus(fileId, FILE_STATUS.ERROR, `APS error: ${apsError.message}`);
      }
    } else {
      // Other file types use standard processing
      setTimeout(async () => {
        await storage.updateFileStatus(fileId, FILE_STATUS.READY);
        await storage.updateFileMetadata(fileId, JSON.stringify({
          viewerType: 'standard',
          processed: true
        }));
      }, 1000);
    }
  } catch (error: any) {
    console.error('File processing error:', error);
    await storage.updateFileStatus(fileId, FILE_STATUS.ERROR, `Processing failed: ${error.message}`);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all files
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.getAllFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Get single file
  app.get("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  // Upload files
  app.post("/api/files/upload", upload.array('files'), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        const fileType = detectFileType(file.originalname, file.mimetype);
        
        const fileData = {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          filePath: file.path,
          fileType,
          status: FILE_STATUS.UPLOADING,
          errorMessage: null,
          metadata: null
        };

        // Validate the file data
        const validatedData = insertFileSchema.parse(fileData);
        
        // Create file record
        const savedFile = await storage.createFile(validatedData);
        uploadedFiles.push(savedFile);

        // Start processing the file asynchronously
        processFile(savedFile.id, fileType, file.path, file.originalname);
      }

      res.json({ 
        message: "Files uploaded successfully", 
        files: uploadedFiles 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid file data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Update file status (for manual retry)
  app.patch("/api/files/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, errorMessage } = req.body;
      
      const updatedFile = await storage.updateFileStatus(id, status, errorMessage);
      
      if (!updatedFile) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json(updatedFile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update file status" });
    }
  });

  // Delete file
  app.delete("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFile(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Serve file content for download
  app.get("/api/files/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimeType);
      res.sendFile(path.resolve(file.filePath));
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Get APS viewer token
  app.get("/api/aps/token", async (req, res) => {
    try {
      const token = await apsService.getViewerToken();
      res.json({ access_token: token, expires_in: 3600 });
    } catch (error: any) {
      console.error('APS token error:', error);
      res.status(500).json({ message: "Failed to get APS token", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
