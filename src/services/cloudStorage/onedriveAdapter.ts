/**
 * OneDrive Storage Adapter
 * Implements cloud storage using Microsoft Graph API (OneDrive)
 */

import type { CloudStorageAdapter, FileUploadResult } from './storageAdapter';
import { logger } from '@/lib/logger';

/**
 * OneDrive Adapter Implementation
 * 
 * Note: This requires:
 * 1. Microsoft Azure App Registration (client ID, client secret)
 * 2. Refresh token stored securely (Supabase Edge Function secrets)
 * 3. Microsoft Graph API permissions (Files.ReadWrite, Sites.ReadWrite.All)
 * 
 * Implementation should be done via Supabase Edge Function for security
 */
export class OneDriveAdapter implements CloudStorageAdapter {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Tokens should be fetched from Supabase Edge Function secrets
    // or obtained via OAuth flow
    this.refreshToken = null; // Will be set from environment
  }

  /**
   * Get access token (refresh if needed)
   * Uses Supabase Edge Function for secure token refresh
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    // Call Supabase Edge Function to get/refresh token
    // This keeps credentials secure on the server
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL and ANON_KEY must be configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/onedrive-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to get access token: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      return this.accessToken;
    } catch (error) {
      logger.error('Error getting OneDrive access token:', error);
      throw new Error(`OneDrive authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Upload file to OneDrive
   * Uses Supabase Edge Function for secure file upload
   */
  async uploadFile(
    file: Buffer | ArrayBuffer,
    fileName: string,
    folderPath: string,
    mimeType: string = 'application/octet-stream'
  ): Promise<FileUploadResult> {
    try {
      // Ensure folder exists and get folder ID
      const folderId = await this.createFolder(folderPath);

      // Convert file to base64
      let base64Data: string;
      if (file instanceof ArrayBuffer) {
        base64Data = this.arrayBufferToBase64(file);
      } else if (typeof Buffer !== 'undefined' && file instanceof Buffer) {
        // Node.js Buffer (for server-side or if Buffer polyfill is available)
        base64Data = file.toString('base64');
      } else {
        // Fallback: try to convert to ArrayBuffer
        if (file instanceof Blob) {
          const arrayBuffer = await file.arrayBuffer();
          base64Data = this.arrayBufferToBase64(arrayBuffer);
        } else {
          base64Data = this.arrayBufferToBase64(file as ArrayBuffer);
        }
      }

      // Upload file using Supabase Edge Function for security
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL and ANON_KEY must be configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/onedrive-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          fileName,
          folderId: folderId || null,
          fileData: base64Data,
          mimeType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`File upload failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      return {
        fileId: result.id,
        fileUrl: result.webUrl || result.downloadUrl,
        fileName,
        folderPath,
      };
    } catch (error) {
      logger.error('Error uploading file to OneDrive:', error);
      throw new Error(`OneDrive upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file URL
   */
  async getFileUrl(fileId: string): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}?select=webUrl,downloadUrl,@microsoft.graph.downloadUrl`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get file URL');
      }

      const data = await response.json();
      return data['@microsoft.graph.downloadUrl'] || data.downloadUrl || data.webUrl;
    } catch (error) {
      logger.error('Error getting OneDrive file URL:', error);
      throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      logger.error('Error deleting OneDrive file:', error);
      throw new Error(`File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create folder (or get existing)
   * Creates folder hierarchy if it doesn't exist
   * Returns folder ID or null to upload to root
   */
  async createFolder(folderPath: string): Promise<string | null> {
    try {
      const accessToken = await this.getAccessToken();

      // Parse folder path (e.g., "Invoices/2025/01-January")
      const parts = folderPath.split('/').filter(Boolean);
      
      // If no path specified, return null (upload to root)
      if (parts.length === 0) {
        return null; // Return null to upload to root
      }

      let parentId: string | null = null; // Start at root (null = root)

      for (const folderName of parts) {
        // Check if folder exists
        const existingFolder = await this.findFolder(folderName, parentId, accessToken);
        
        if (existingFolder) {
          parentId = existingFolder.id;
        } else {
          // Create folder
          const newFolder = await this.createFolderInDrive(folderName, parentId, accessToken);
          parentId = newFolder.id;
        }
      }

      return parentId;
    } catch (error) {
      logger.error('Error creating OneDrive folder:', error);
      // If folder creation fails, return null to upload to root as fallback
      logger.warn('Folder creation failed, uploading to root instead');
      return null;
    }
  }

  /**
   * Find folder by name and parent
   */
  private async findFolder(
    folderName: string,
    parentId: string | null,
    accessToken: string
  ): Promise<{ id: string } | null> {
    try {
      // Build query path
      const parentPath = parentId 
        ? `/me/drive/items/${parentId}/children`
        : '/me/drive/root/children';
      
      const response = await fetch(
        `https://graph.microsoft.com/v1.0${parentPath}?$filter=name eq '${encodeURIComponent(folderName)}' and folder ne null`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.value && data.value.length > 0 ? { id: data.value[0].id } : null;
    } catch (error) {
      logger.error('Error finding OneDrive folder:', error);
      return null;
    }
  }

  /**
   * Create folder in OneDrive
   */
  private async createFolderInDrive(
    folderName: string,
    parentId: string | null,
    accessToken: string
  ): Promise<{ id: string }> {
    const parentPath = parentId 
      ? `/me/drive/items/${parentId}/children`
      : '/me/drive/root/children';
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0${parentPath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to create folder: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Check if file exists
   */
  async fileExists(fileId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}?$select=id`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
