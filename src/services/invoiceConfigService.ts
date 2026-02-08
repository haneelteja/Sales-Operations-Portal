/**
 * Invoice Configuration Service
 * Manages application-level invoice-related configurations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface InvoiceConfiguration {
  id: string;
  config_key: string;
  config_value: string;
  config_type: 'string' | 'boolean' | 'number';
  description: string;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

/**
 * Fetch all invoice configurations
 */
export async function getInvoiceConfigurations(): Promise<InvoiceConfiguration[]> {
  try {
    const { data, error } = await supabase
      .from('invoice_configurations')
      .select('*')
      .order('config_key', { ascending: true });

    if (error) {
      logger.error('Error fetching invoice configurations:', error);
      throw new Error(`Failed to fetch configurations: ${error.message}`);
    }

    return (data || []) as InvoiceConfiguration[];
  } catch (error) {
    logger.error('Error in getInvoiceConfigurations:', error);
    throw error;
  }
}

/**
 * Update a configuration value
 */
export async function updateInvoiceConfiguration(
  id: string,
  config_value: string
): Promise<InvoiceConfiguration> {
  try {
    // Get current user ID for updated_by field
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('invoice_configurations')
      .update({
        config_value,
        updated_by: user?.id || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating invoice configuration:', error);
      throw new Error(`Failed to update configuration: ${error.message}`);
    }

    if (!data) {
      throw new Error('Configuration not found');
    }

    return data as InvoiceConfiguration;
  } catch (error) {
    logger.error('Error in updateInvoiceConfiguration:', error);
    throw error;
  }
}

/**
 * Get invoice folder path from configuration
 * Returns default if not found
 */
export async function getInvoiceFolderPath(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('invoice_configurations')
      .select('config_value')
      .eq('config_key', 'invoice_folder_path')
      .single();

    if (error || !data) {
      logger.warn('Invoice folder path not found, using default');
      return 'MyDrive/Invoice';
    }

    return data.config_value || 'MyDrive/Invoice';
  } catch (error) {
    logger.error('Error in getInvoiceFolderPath:', error);
    return 'MyDrive/Invoice'; // Fallback to default
  }
}

/**
 * Check if auto invoice generation is enabled
 * Returns true if not found (default enabled)
 */
export async function isAutoInvoiceEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('invoice_configurations')
      .select('config_value')
      .eq('config_key', 'auto_invoice_generation_enabled')
      .single();

    if (error || !data) {
      logger.warn('Auto invoice generation config not found, defaulting to enabled');
      return true; // Default to enabled
    }

    // Convert string to boolean
    return data.config_value === 'true';
  } catch (error) {
    logger.error('Error in isAutoInvoiceEnabled:', error);
    return true; // Fallback to enabled
  }
}

/**
 * Get storage provider from configuration
 * Returns default if not found
 */
export async function getStorageProvider(): Promise<'google_drive' | 'onedrive'> {
  try {
    const { data, error } = await supabase
      .from('invoice_configurations')
      .select('config_value')
      .eq('config_key', 'storage_provider')
      .single();

    if (error || !data) {
      logger.warn('Storage provider not found, using default');
      return 'google_drive';
    }

    const provider = data.config_value as string;
    if (provider === 'onedrive' || provider === 'google_drive') {
      return provider;
    }

    return 'google_drive'; // Default fallback
  } catch (error) {
    logger.error('Error in getStorageProvider:', error);
    return 'google_drive'; // Fallback to default
  }
}

/**
 * Validate folder path format (works for both Google Drive and OneDrive)
 */
export function validateFolderPath(path: string): { valid: boolean; error?: string } {
  if (!path || path.trim() === '') {
    return { valid: false, error: 'Folder path is required' };
  }

  if (path.length > 255) {
    return { valid: false, error: 'Path cannot exceed 255 characters' };
  }

  // Path validation for both Google Drive and OneDrive
  // Can contain letters, numbers, spaces, forward slashes, hyphens, underscores
  // Google Drive: Must start with "MyDrive/"
  // OneDrive: Can start with any folder name or be relative
  const pathPattern = /^[a-zA-Z0-9\s\/\-_]+$/;
  
  if (!pathPattern.test(path)) {
    return {
      valid: false,
      error: 'Invalid folder path format. Use format: FolderName/SubFolder or MyDrive/FolderName'
    };
  }

  return { valid: true };
}
