/**
 * Cloud Storage Adapter Interface
 * Defines the contract for cloud storage implementations
 */

export interface FileUploadResult {
  fileId: string;
  fileUrl: string;
  fileName: string;
  folderPath: string;
}

export interface CloudStorageAdapter {
  /**
   * Upload a file to cloud storage
   */
  uploadFile(
    file: Buffer | ArrayBuffer,
    fileName: string,
    folderPath: string,
    mimeType?: string
  ): Promise<FileUploadResult>;

  /**
   * Get a direct download URL for a file
   */
  getFileUrl(fileId: string): Promise<string>;

  /**
   * Delete a file from cloud storage
   */
  deleteFile(fileId: string): Promise<void>;

  /**
   * Create a folder if it doesn't exist, return folder ID
   * Returns null if folderPath is empty (upload to root)
   */
  createFolder(folderPath: string): Promise<string | null>;

  /**
   * Check if a file exists
   */
  fileExists(fileId: string): Promise<boolean>;
}
