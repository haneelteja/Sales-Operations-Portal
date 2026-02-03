/**
 * WhatsApp Service
 * Manages WhatsApp messaging via 360Messenger API
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface WhatsAppLog {
  id: string;
  customer_id: string;
  customer_name: string;
  whatsapp_number: string;
  message_type: 'stock_delivered' | 'invoice' | 'payment_reminder' | 'festival';
  trigger_type: 'auto' | 'scheduled' | 'manual';
  status: 'pending' | 'sent' | 'failed';
  retry_count: number;
  max_retries: number;
  message_content: string | null;
  template_id: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  failure_reason: string | null;
  api_response: any;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  template_name: string;
  message_type: 'stock_delivered' | 'invoice' | 'payment_reminder' | 'festival';
  template_content: string;
  placeholders: string[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConfig {
  whatsapp_enabled: boolean;
  whatsapp_stock_delivered_enabled: boolean;
  whatsapp_invoice_enabled: boolean;
  whatsapp_payment_reminder_enabled: boolean;
  whatsapp_api_key: string;
  whatsapp_api_url: string;
  whatsapp_retry_max: number;
  whatsapp_retry_interval_minutes: number;
  whatsapp_failure_notification_email: string;
  whatsapp_payment_reminder_days: string;
}

export interface SendMessageRequest {
  customerId: string;
  messageType: 'stock_delivered' | 'invoice' | 'payment_reminder' | 'festival';
  triggerType: 'auto' | 'scheduled' | 'manual';
  templateId?: string;
  customMessage?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  placeholders?: Record<string, string>;
}

/**
 * Fetch WhatsApp message logs with pagination and filters
 */
export async function getWhatsAppLogs(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: 'pending' | 'sent' | 'failed';
    messageType?: string;
    triggerType?: string;
    startDate?: string;
    endDate?: string;
  },
  sortBy: 'created_at' | 'status' | 'customer_name' = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ logs: WhatsAppLog[]; total: number }> {
  try {
    let query = supabase
      .from('whatsapp_message_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.messageType) {
      query = query.eq('message_type', filters.messageType);
    }
    if (filters?.triggerType) {
      query = query.eq('trigger_type', filters.triggerType);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching WhatsApp logs:', error);
      throw new Error(`Failed to fetch WhatsApp logs: ${error.message}`);
    }

    return {
      logs: (data || []) as WhatsAppLog[],
      total: count || 0,
    };
  } catch (error) {
    logger.error('Error in getWhatsAppLogs:', error);
    throw error;
  }
}

/**
 * Get WhatsApp configuration
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  try {
    const { data, error } = await supabase
      .from('invoice_configurations')
      .select('config_key, config_value')
      .like('config_key', 'whatsapp_%');

    if (error) {
      logger.error('Error fetching WhatsApp config:', error);
      throw new Error(`Failed to fetch config: ${error.message}`);
    }

    const config: Partial<WhatsAppConfig> = {};
    (data || []).forEach((item) => {
      // Map config keys to WhatsAppConfig interface keys
      const configKeyMap: Record<string, keyof WhatsAppConfig> = {
        'whatsapp_enabled': 'whatsapp_enabled',
        'whatsapp_stock_delivered_enabled': 'whatsapp_stock_delivered_enabled',
        'whatsapp_invoice_enabled': 'whatsapp_invoice_enabled',
        'whatsapp_payment_reminder_enabled': 'whatsapp_payment_reminder_enabled',
        'whatsapp_api_key': 'whatsapp_api_key',
        'whatsapp_api_url': 'whatsapp_api_url',
        'whatsapp_retry_max': 'whatsapp_retry_max',
        'whatsapp_retry_interval_minutes': 'whatsapp_retry_interval_minutes',
        'whatsapp_failure_notification_email': 'whatsapp_failure_notification_email',
        'whatsapp_payment_reminder_days': 'whatsapp_payment_reminder_days',
      };

      const mappedKey = configKeyMap[item.config_key];
      if (!mappedKey) return;

      const value = item.config_value;

      // Convert string values to appropriate types
      if (mappedKey.includes('_enabled')) {
        config[mappedKey] = (value === 'true') as any;
      } else if (mappedKey === 'whatsapp_retry_max' || mappedKey === 'whatsapp_retry_interval_minutes') {
        config[mappedKey] = parseInt(value, 10) as any;
      } else {
        config[mappedKey] = value as any;
      }
    });

    // Set defaults for missing values
    return {
      whatsapp_enabled: config.whatsapp_enabled ?? false,
      whatsapp_stock_delivered_enabled: config.whatsapp_stock_delivered_enabled ?? false,
      whatsapp_invoice_enabled: config.whatsapp_invoice_enabled ?? false,
      whatsapp_payment_reminder_enabled: config.whatsapp_payment_reminder_enabled ?? false,
      whatsapp_api_key: config.whatsapp_api_key ?? '',
      whatsapp_api_url: config.whatsapp_api_url ?? 'https://api.360messenger.com',
      whatsapp_retry_max: config.whatsapp_retry_max ?? 3,
      whatsapp_retry_interval_minutes: config.whatsapp_retry_interval_minutes ?? 30,
      whatsapp_failure_notification_email: config.whatsapp_failure_notification_email ?? 'pega2023test@gmail.com',
      whatsapp_payment_reminder_days: config.whatsapp_payment_reminder_days ?? '3,7',
    } as WhatsAppConfig;
  } catch (error) {
    logger.error('Error in getWhatsAppConfig:', error);
    throw error;
  }
}

/**
 * Update WhatsApp configuration
 */
export async function updateWhatsAppConfig(
  key: string,
  value: string | boolean
): Promise<void> {
  try {
    const configKey = key.startsWith('whatsapp_') ? key : `whatsapp_${key}`;
    const configValue = typeof value === 'boolean' ? String(value) : value;

    const { error } = await supabase
      .from('invoice_configurations')
      .update({ config_value: configValue })
      .eq('config_key', configKey);

    if (error) {
      logger.error('Error updating WhatsApp config:', error);
      throw new Error(`Failed to update config: ${error.message}`);
    }
  } catch (error) {
    logger.error('Error in updateWhatsAppConfig:', error);
    throw error;
  }
}

/**
 * Get all WhatsApp templates
 */
export async function getWhatsAppTemplates(
  messageType?: string
): Promise<WhatsAppTemplate[]> {
  try {
    let query = supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('is_active', true);

    if (messageType) {
      query = query.eq('message_type', messageType);
    }

    query = query.order('message_type', { ascending: true })
      .order('is_default', { ascending: false })
      .order('template_name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return (data || []) as WhatsAppTemplate[];
  } catch (error) {
    logger.error('Error in getWhatsAppTemplates:', error);
    throw error;
  }
}

/**
 * Create or update WhatsApp template
 */
export async function saveWhatsAppTemplate(
  template: Partial<WhatsAppTemplate> & { template_name: string; message_type: string; template_content: string }
): Promise<WhatsAppTemplate> {
  try {
    // Extract placeholders from template content
    const placeholderRegex = /\{(\w+)\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = placeholderRegex.exec(template.template_content)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }

    const templateData = {
      ...template,
      placeholders,
    };

    let result;
    if (template.id) {
      // Update existing template
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .update(templateData)
        .eq('id', template.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new template
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result as WhatsAppTemplate;
  } catch (error) {
    logger.error('Error saving template:', error);
    throw new Error(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Send WhatsApp message via Edge Function
 */
export async function sendWhatsAppMessage(
  request: SendMessageRequest
): Promise<{ success: boolean; messageLogId?: string; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || response.statusText);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Retry failed message
 */
export async function retryWhatsAppMessage(messageLogId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ messageLogId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || response.statusText);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    logger.error('Error retrying WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate WhatsApp number format
 */
export function validateWhatsAppNumber(number: string): { valid: boolean; error?: string } {
  const cleaned = number.replace(/\s/g, '');
  const regex = /^\+?[1-9]\d{1,14}$/;

  if (!cleaned) {
    return { valid: false, error: 'WhatsApp number is required' };
  }

  if (!regex.test(cleaned)) {
    return { valid: false, error: 'Invalid WhatsApp number format. Use format: +919876543210' };
  }

  return { valid: true };
}

/**
 * Extract placeholders from template content
 */
export function extractPlaceholders(templateContent: string): string[] {
  const placeholderRegex = /\{(\w+)\}/g;
  const placeholders: string[] = [];
  let match;
  while ((match = placeholderRegex.exec(templateContent)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1]);
    }
  }
  return placeholders;
}

/**
 * Replace placeholders in template with values
 */
export function replacePlaceholders(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] || match;
  });
}
