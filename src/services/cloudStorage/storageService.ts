/**
 * Storage Service
 * Factory pattern to select and use cloud storage adapter
 */

import type { CloudStorageAdapter, FileUploadResult } from './storageAdapter';
import { GoogleDriveAdapter } from './googleDriveAdapter';
import { OneDriveAdapter } from './onedriveAdapter';
import { getInvoiceFolderPath } from '@/services/invoiceConfigService';

export type StorageProvider = 'google_drive' | 'onedrive';

/**
 * Get storage adapter based on provider
 */
export function getStorageAdapter(provider: StorageProvider): CloudStorageAdapter {
  switch (provider) {
    case 'google_drive':
      return new GoogleDriveAdapter();
    case 'onedrive':
      return new OneDriveAdapter();
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}

/**
 * Storage Service - High-level interface for cloud storage operations
 */
export class StorageService {
  private adapter: CloudStorageAdapter;

  constructor(provider: StorageProvider = 'google_drive') {
    this.adapter = getStorageAdapter(provider);
  }

  /**
   * Upload invoice documents to cloud storage
   */
  async uploadInvoiceDocuments(
    wordBuffer: ArrayBuffer,
    pdfBuffer: ArrayBuffer | null,
    invoiceNumber: string,
    invoiceDate: string
  ): Promise<{
    word: FileUploadResult;
    pdf: FileUploadResult | null;
    folderPath: string;
  }> {
    try {
      // Get base folder path from configuration
      // For Google Drive: default is "MyDrive/Invoice"
      // For OneDrive: can be any folder path like "Invoice" or "Documents/Invoice"
      const baseFolderPath = await getInvoiceFolderPath();
      
      // Build folder path: {baseFolderPath}/YYYY/MM-MonthName
      const date = new Date(invoiceDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[date.getMonth()];
      
      // Combine base path with year/month structure
      const folderPath = `${baseFolderPath}/${year}/${month}-${monthName}`;

      // Upload Word document
      const wordResult = await this.adapter.uploadFile(
        wordBuffer,
        `${invoiceNumber}.docx`,
        folderPath,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      // Upload PDF document if available
      let pdfResult: FileUploadResult | null = null;
      if (pdfBuffer) {
        pdfResult = await this.adapter.uploadFile(
          pdfBuffer,
          `${invoiceNumber}.pdf`,
          folderPath,
          'application/pdf'
        );
      }

      return {
        word: wordResult,
        pdf: pdfResult,
        folderPath,
      };
    } catch (error) {
      throw new Error(`Invoice upload failed: ${error.message}`);
    }
  }

  /**
   * Get file URL
   */
  async getFileUrl(fileId: string): Promise<string> {
    return this.adapter.getFileUrl(fileId);
  }

  /**
   * Delete invoice files
   */
  async deleteInvoiceFiles(
    wordFileId: string | null,
    pdfFileId: string | null
  ): Promise<void> {
    const promises: Promise<void>[] = [];
    
    if (wordFileId) {
      promises.push(this.adapter.deleteFile(wordFileId));
    }
    
    if (pdfFileId) {
      promises.push(this.adapter.deleteFile(pdfFileId));
    }

    await Promise.all(promises);
  }
}
