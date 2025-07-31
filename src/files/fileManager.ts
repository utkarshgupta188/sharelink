export interface FileInfo {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  path: string;
}

export class FileManager {
  private filesDir: string;
  private fileRegistry: Map<string, FileInfo> = new Map();
  private p2pFiles: Map<string, any> = new Map(); // Store P2P files

  constructor() {
    this.filesDir = './uploads';
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    // For now, we'll just ensure the directory exists in memory
    // In a real implementation, you'd use fs.mkdirSync
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async addFile(filePath: string, originalName: string, mimeType: string): Promise<string> {
    const fileId = this.generateId();
    
    const fileInfo: FileInfo = {
      id: fileId,
      name: originalName,
      size: 0, // Would get from fs.statSync in real implementation
      mimeType,
      uploadedAt: new Date(),
      path: filePath
    };

    this.fileRegistry.set(fileId, fileInfo);
    return fileId;
  }

  async getFile(fileId: string): Promise<FileInfo | null> {
    return this.fileRegistry.get(fileId) || null;
  }

  async listFiles(): Promise<FileInfo[]> {
    return Array.from(this.fileRegistry.values());
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const fileInfo = this.fileRegistry.get(fileId);
    if (!fileInfo) {
      return false;
    }

    try {
      // In real implementation, would delete physical file
      // fs.unlinkSync(fileInfo.path);
      
      // Remove from registry
      this.fileRegistry.delete(fileId);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async saveUploadedFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const fileId = this.generateId();
    
    // Add to registry with the actual buffer data
    const fileInfo: FileInfo = {
      id: fileId,
      name: originalName,
      size: buffer.length,
      mimeType,
      uploadedAt: new Date(),
      path: `memory://${fileId}` // Indicate this is stored in memory
    };

    this.fileRegistry.set(fileId, fileInfo);
    
    // Store the actual file content in memory (in a real app, this would be saved to disk)
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
