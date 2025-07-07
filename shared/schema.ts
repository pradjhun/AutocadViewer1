import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // 'autocad', 'pdf', 'image', 'document', 'other'
  status: text("status").notNull().default("uploading"), // 'uploading', 'processing', 'ready', 'error'
  errorMessage: text("error_message"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  metadata: text("metadata"), // JSON string for additional file info
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadedAt: true,
  processedAt: true,
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

// File type enums
export const FILE_TYPES = {
  AUTOCAD: 'autocad',
  PDF: 'pdf',
  IMAGE: 'image',
  DOCUMENT: 'document',
  OTHER: 'other'
} as const;

export const FILE_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  ERROR: 'error'
} as const;
