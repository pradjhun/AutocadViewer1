# AutoCAD Web Viewer Application

## Overview

This is a full-stack web application designed for uploading, processing, and viewing AutoCAD files (DWG, DXF) along with other document types. The application features a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **File Upload**: Multer middleware for handling multipart/form-data
- **Database Provider**: Neon Database (serverless PostgreSQL)

### Build & Development
- **Development**: tsx for TypeScript execution in development
- **Production Build**: esbuild for backend bundling, Vite for frontend
- **Development Tools**: Replit integration with cartographer and error overlay

## Key Components

### Database Schema
- **Files Table**: Stores file metadata including filename, size, type, status, and processing information
- **File Types**: Support for AutoCAD (.dwg, .dxf), PDF, images, documents, and other file types
- **File Status**: Tracks processing states (uploading, processing, ready, error)

### File Processing Pipeline
1. **Upload**: Files are uploaded via multipart form with size validation (50MB limit)
2. **Type Detection**: Automatic file type classification based on extension and MIME type
3. **Processing**: Simulated processing workflow with status updates
4. **Storage**: File metadata stored in database, files stored in uploads directory

### API Endpoints
- `POST /api/files/upload` - Multi-file upload with processing initiation
- `GET /api/files` - Retrieve all files with status information
- `GET /api/files/:id` - Get specific file details
- `PATCH /api/files/:id/status` - Update file processing status
- `DELETE /api/files/:id` - Remove file and metadata

### Frontend Components
- **FileUpload**: Drag-and-drop file upload interface with validation
- **FileQueue**: Real-time file list with status indicators and actions
- **FileViewer**: File preview and metadata display (with AutoCAD viewer simulation)
- **Header**: Application navigation and branding

## Data Flow

1. **File Upload**: Users drag files to upload area or use file picker
2. **Client Validation**: File size and type validation on frontend
3. **Server Processing**: Files uploaded to server, metadata stored in database
4. **Status Updates**: Real-time polling for processing status updates
5. **File Display**: Updated file list with current status and actions
6. **File Viewing**: Click to view file details and simulated CAD viewer

## External Dependencies

### Backend Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **multer**: File upload handling middleware
- **express**: Web application framework

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing library
- **react-hook-form**: Form state management

### Development Dependencies
- **vite**: Frontend build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: JavaScript bundler for production builds

## Deployment Strategy

### Environment Setup
- **Database**: Requires DATABASE_URL environment variable for PostgreSQL connection
- **File Storage**: Local file system storage in uploads/ directory
- **Build Process**: Separate frontend and backend builds with unified distribution

### Production Build
1. **Frontend**: Vite builds static assets to dist/public
2. **Backend**: esbuild bundles server code to dist/index.js
3. **Database**: Drizzle migrations applied via `npm run db:push`
4. **Startup**: Node.js serves bundled backend with static file serving

### Development Workflow
- **Development Server**: tsx runs TypeScript directly with hot reload
- **Database Migrations**: Schema changes pushed directly to database
- **File Uploads**: Local uploads directory for development testing

## Changelog
- July 07, 2025. Initial setup with complete file upload and viewer system
- July 07, 2025. Enhanced AutoCAD viewer with realistic drawing display, layer management, and file metadata
- July 07, 2025. Added comprehensive PDF and Image viewers with controls and realistic content
- July 07, 2025. Implemented file download functionality and improved user interface

## Recent Features Added
- ✓ Fixed file upload FormData handling issue 
- ✓ Enhanced AutoCAD viewer with simulated CAD drawings, layers panel, and zoom controls
- ✓ Improved PDF viewer with document preview and navigation controls  
- ✓ Advanced image viewer with zoom and rotation controls
- ✓ File download functionality for all uploaded files
- ✓ Real-time file processing status with metadata extraction
- ✓ Professional viewer interfaces with appropriate styling for each file type
- ✓ Integrated real Autodesk Platform Services (APS) for actual AutoCAD file viewing
- ✓ Added APS authentication and file processing pipeline
- ✓ Real AutoCAD file translation and viewer initialization

## User Preferences

Preferred communication style: Simple, everyday language.