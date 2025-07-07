import { files, type File, type InsertFile } from "@shared/schema";

export interface IStorage {
  getFile(id: number): Promise<File | undefined>;
  getAllFiles(): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFileStatus(id: number, status: string, errorMessage?: string): Promise<File | undefined>;
  updateFileMetadata(id: number, metadata: string): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private files: Map<number, File>;
  private currentId: number;

  constructor() {
    this.files = new Map();
    this.currentId = 1;
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getAllFiles(): Promise<File[]> {
    return Array.from(this.files.values()).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentId++;
    const file: File = { 
      ...insertFile, 
      id,
      uploadedAt: new Date(),
      processedAt: null
    };
    this.files.set(id, file);
    return file;
  }

  async updateFileStatus(id: number, status: string, errorMessage?: string): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;

    const updatedFile: File = {
      ...file,
      status,
      errorMessage: errorMessage || null,
      processedAt: status === 'ready' || status === 'error' ? new Date() : file.processedAt
    };
    
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async updateFileMetadata(id: number, metadata: string): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;

    const updatedFile: File = { ...file, metadata };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }
}

export const storage = new MemStorage();
