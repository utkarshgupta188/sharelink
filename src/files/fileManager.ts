import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface FileMetadata {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
  ownerId: string;
}

export class FileManager {
  private files: Map<string, FileMetadata> = new Map();
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDirectory();
  }

  private ensureUploadsDirectory(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  addFile(file: Express.Multer.File, ownerId: string): FileMetadata {
    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const filename = `${fileId}${fileExtension}`;
    const filePath = path.join(this.uploadsDir, filename);

    // Move file to uploads directory
    fs.writeFileSync(filePath, file.buffer);

    const metadata: FileMetadata = {
      id: fileId,
      originalName: file.originalname,
      filename,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
      ownerId
    };

    this.files.set(fileId, metadata);
    return metadata;
  }

  getFile(fileId: string): FileMetadata | undefined {
    return this.files.get(fileId);
  }

  getFilesByOwner(ownerId: string): FileMetadata[] {
    return Array.from(this.files.values()).filter(file => file.ownerId === ownerId);
  }

  getAllFiles(): FileMetadata[] {
    return Array.from(this.files.values());
  }

  getFilePath(fileId: string): string | null {
    const file = this.files.get(fileId);
    if (!file) return null;

    const filePath = path.join(this.uploadsDir, file.filename);
    return fs.existsSync(filePath) ? filePath : null;
  }

  deleteFile(fileId: string, requesterId: string): boolean {
    const file = this.files.get(fileId);
    if (!file || file.ownerId !== requesterId) {
      return false;
    }

    const filePath = path.join(this.uploadsDir, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    this.files.delete(fileId);
    return true;
  }
}
    this.fileContent.set(fileId, buffer);
    
    return fileId;
  }

  private fileContent: Map<string, Buffer> = new Map();

  // Get file content for download
  getFileContent(fileId: string): Buffer | null {
    return this.fileContent.get(fileId) || null;
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  // Simulate some demo files
  initializeDemoFiles(): void {
    const demoFiles = [
      { name: 'document.pdf', size: 1024000, mimeType: 'application/pdf' },
      { name: 'image.jpg', size: 512000, mimeType: 'image/jpeg' },
      { name: 'video.mp4', size: 10240000, mimeType: 'video/mp4' },
    ];

    demoFiles.forEach(file => {
      const fileId = this.generateId();
      const fileInfo: FileInfo = {
        id: fileId,
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: new Date(),
        path: `./uploads/${fileId}_${file.name}`
      };
      this.fileRegistry.set(fileId, fileInfo);
    });
  }

  // P2P file management methods
  async saveP2PFile(fileData: string, fileName: string, fileType: string, otp: string): Promise<string> {
    const fileId = this.generateId();
    
    // Store P2P file data
    this.p2pFiles.set(fileId, {
      id: fileId,
      fileName,
      fileType,
      data: fileData,
      otp,
      uploadedAt: new Date()
    });

    return fileId;
  }

  async getP2PFileData(fileId: string): Promise<any> {
    return this.p2pFiles.get(fileId) || null;
  }
}
