/**
 * Application Configuration Tab
 * Manages application-level invoice-related configurations
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, RefreshCw, Edit, Settings, Shield } from 'lucide-react';
import {
  getInvoiceConfigurations,
  updateInvoiceConfiguration,
  validateFolderPath,
  type InvoiceConfiguration,
} from '@/services/invoiceConfigService';
import { EditFolderPathDialog } from './EditFolderPathDialog';
import { AutoInvoiceToggle } from './AutoInvoiceToggle';
import { StorageProviderSelect } from './StorageProviderSelect';
import { BackupLogsDialog } from './BackupLogsDialog';
import { EditBackupFolderDialog } from './EditBackupFolderDialog';
import { EditBackupTimeDialog } from './EditBackupTimeDialog';
import { EditNotificationEmailDialog } from './EditNotificationEmailDialog';
import { EditSkusAvailableDialog } from './EditSkusAvailableDialog';
import { EditListConfigDialog } from './EditListConfigDialog';
import { EditTentativeDeliveryDaysDialog } from './EditTentativeDeliveryDaysDialog';
import { EditWhatsAppApiKeyDialog } from './EditWhatsAppApiKeyDialog';
import { triggerManualBackup, getBackupConfig, type BackupConfig } from '@/services/backupService';
import { Database, Play } from 'lucide-react';

const BACKUP_TABLE_KEYS = ['backup_folder_path', 'backup_schedule_time_ist'];

const ApplicationConfigurationTab: React.FC = () => {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConfig, setEditingConfig] = useState<InvoiceConfiguration | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBackupLogsOpen, setIsBackupLogsOpen] = useState(false);
  const [isBackupFolderDialogOpen, setIsBackupFolderDialogOpen] = useState(false);
  const [isBackupTimeDialogOpen, setIsBackupTimeDialogOpen] = useState(false);
  const [isNotificationEmailDialogOpen, setIsNotificationEmailDialogOpen] = useState(false);
  const [isSkusAvailableDialogOpen, setIsSkusAvailableDialogOpen] = useState(false);
  const [isTransportVendorsDialogOpen, setIsTransportVendorsDialogOpen] = useState(false);
  const [isExpenseGroupsDialogOpen, setIsExpenseGroupsDialogOpen] = useState(false);
  const [isTentativeDeliveryDaysDialogOpen, setIsTentativeDeliveryDaysDialogOpen] = useState(false);
  const [isPurchaseItemsDialogOpen, setIsPurchaseItemsDialogOpen] = useState(false);
  const [isWhatsAppApiKeyDialogOpen, setIsWhatsAppApiKeyDialogOpen] = useState(false);
  const [isRunningBackup, setIsRunningBackup] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch configurations
  const { data: configurations, isLoading, refetch } = useQuery({
    queryKey: ['invoice-configurations'],
    queryFn: getInvoiceConfigurations,
  });

  // Fetch backup configuration
  const { data: backupConfig, refetch: refetchBackupConfig } = useQuery({
    queryKey: ['backup-config'],
    queryFn: getBackupConfig,
  });

  // Update configuration mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, config_value }: { id: string; config_value: string }) =>
      updateInvoiceConfiguration(id, config_value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-configurations'] });
      toast({
        title: 'Success',
        description: 'Configuration updated successfully',
      });
      setIsEditDialogOpen(false);
      setEditingConfig(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update configuration',
        variant: 'destructive',
      });
    },
  });

  // Filter configurations: exclude WhatsApp; include main configs + Database Backup Folder Path + Database Backup Time
  const mainConfigsCount = useMemo(() => {
    if (!configurations) return 0;
    return configurations.filter(
      (c) =>
        (c.config_key === 'whatsapp_api_key' || !c.config_key.startsWith('whatsapp_')) &&
        (!c.config_key.startsWith('backup_') || BACKUP_TABLE_KEYS.includes(c.config_key))
    ).length;
  }, [configurations]);

  // Display order: 1. SKUs, 2. Item list, 3. Auto Invoice, then rest (exclude whatsapp_ except whatsapp_api_key)
  const orderedDisplayConfigs = useMemo(() => {
    if (!configurations) return [];

    const mainAndBackupConfigs = configurations.filter(
      (config) =>
        (config.config_key === 'whatsapp_api_key' || !config.config_key.startsWith('whatsapp_')) &&
        (!config.config_key.startsWith('backup_') || BACKUP_TABLE_KEYS.includes(config.config_key))
    );

    const order: string[] = [
      'auto_invoice_generation_enabled',
      'invoice_folder_path',
      'storage_provider',
      'transport_vendors',
      'expense_groups',
      'tentative_delivery_days',
      'whatsapp_api_key',
      'backup_folder_path',
      'backup_schedule_time_ist',
      'backup_notification_email',
      'invoice_number_format',
    ];

    const configMap = new Map(mainAndBackupConfigs.map((c) => [c.config_key, c]));
    const seen = new Set<string>();
    const result: (InvoiceConfiguration & { isCustom?: boolean; customKey?: string })[] = [];

    // Row 1: SKUs (custom - not from config table)
    result.push({
      id: '',
      config_key: 'sku_configurations',
      config_value: '',
      config_type: 'string',
      description: "SKU's available in the plant",
      updated_by: null,
      updated_at: '',
      created_at: '',
      isCustom: true,
      customKey: 'sku_configurations',
    } as InvoiceConfiguration & { isCustom?: boolean; customKey?: string });

    // Row 2: Item list (purchase_items)
    const purchaseItemsConfig = configMap.get('purchase_items');
    if (purchaseItemsConfig) {
      result.push(purchaseItemsConfig);
      seen.add('purchase_items');
    } else {
      result.push({
        id: '',
        config_key: 'purchase_items',
        config_value: '[]',
        config_type: 'string',
        description: 'Item list for Purchase dropdown (preforms, caps, shrink)',
        updated_by: null,
        updated_at: '',
        created_at: '',
        isCustom: true,
        customKey: 'purchase_items',
      } as InvoiceConfiguration & { isCustom?: boolean; customKey?: string });
    }

    // Row 3+: Ordered configs
    for (const key of order) {
      if (seen.has(key)) continue;
      const config = configMap.get(key);
      if (config) {
        result.push(config);
        seen.add(key);
      }
    }

    // Add any remaining configs not in order
    for (const config of mainAndBackupConfigs) {
      if (!seen.has(config.config_key)) {
        result.push(config);
      }
    }

    if (!searchQuery.trim()) return result;
    const query = searchQuery.toLowerCase();
    return result.filter((config) =>
      config.description?.toLowerCase().includes(query)
    );
  }, [configurations, searchQuery]);

  const filteredConfigurations = orderedDisplayConfigs;

  // Handle edit button click
  const handleEdit = (config: InvoiceConfiguration) => {
    if (config.config_key === 'invoice_folder_path') {
      setEditingConfig(config);
      setIsEditDialogOpen(true);
    }
  };

  // Handle folder path save
  const handleSaveFolderPath = (newPath: string) => {
    if (!editingConfig) return;

    // Validate path
    const validation = validateFolderPath(newPath);
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate({
      id: editingConfig.id,
      config_value: newPath,
    });
  };

  // Handle toggle switch change
  const handleToggleChange = (config: InvoiceConfiguration, newValue: boolean) => {
    updateMutation.mutate({
      id: config.id,
      config_value: String(newValue),
    });
  };

  // Handle storage provider change
  const handleStorageProviderChange = (config: InvoiceConfiguration, newValue: 'google_drive' | 'onedrive') => {
    updateMutation.mutate({
      id: config.id,
      config_value: newValue,
    });
  };

  // Handle backup folder edit
  const handleBackupFolderEdit = (config: InvoiceConfiguration) => {
    setEditingConfig(config);
    setIsBackupFolderDialogOpen(true);
  };

  // Handle backup time edit
  const handleBackupTimeEdit = (config: InvoiceConfiguration) => {
    setEditingConfig(config);
    setIsBackupTimeDialogOpen(true);
  };

  // Handle notification email edit
  const handleNotificationEmailEdit = (config: InvoiceConfiguration) => {
    setEditingConfig(config);
    setIsNotificationEmailDialogOpen(true);
  };

  // Handle manual backup trigger
  const handleManualBackup = async () => {
    setIsRunningBackup(true);
    try {
      const result = await triggerManualBackup();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Backup started successfully',
        });
        // Refresh backup config to get updated status
        refetchBackupConfig();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to start backup',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start backup',
        variant: 'destructive',
      });
    } finally {
      setIsRunningBackup(false);
    }
  };

  // Handle backup config refresh
  const handleBackupConfigRefresh = () => {
    refetchBackupConfig();
    setIsBackupFolderDialogOpen(false);
    setIsNotificationEmailDialogOpen(false);
    setEditingConfig(null);
  };

  if (profile?.role !== 'manager') {
    return (
      <Alert className="m-6" variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. This page is only available to users with Manager role.
          Your current role: {profile?.role || 'Unknown'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Application Configuration</h2>
        <p className="text-gray-600">
          Manage application-level invoice generation settings and storage paths
        </p>
      </div>

      {/* Search and Refresh */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search configurations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurations
            </CardTitle>
            <CardDescription className="m-0">
              Manage invoice generation settings and storage paths
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {filteredConfigurations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No configurations found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[10%] text-center">S.NO</TableHead>
                    <TableHead className="w-[60%]">Description</TableHead>
                    <TableHead className="w-[30%] text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigurations.map((config, index) => (
                    <TableRow key={config.id || config.config_key || index}>
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>{config.description}</TableCell>
                      <TableCell className="text-center align-middle">
                        {config.config_key === 'sku_configurations' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSkusAvailableDialogOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : config.config_key === 'purchase_items' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPurchaseItemsDialogOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : config.config_key === 'invoice_folder_path' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(config)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : config.config_key === 'auto_invoice_generation_enabled' ? (
                          <AutoInvoiceToggle
                            config={config}
                            value={config.config_value === 'true'}
                            onChange={(newValue) => handleToggleChange(config, newValue)}
                            isLoading={updateMutation.isPending}
                          />
                        ) : config.config_key === 'storage_provider' ? (
                          <StorageProviderSelect
                            config={config}
                            value={config.config_value === 'onedrive' ? 'onedrive' : 'google_drive'}
                            onChange={(newValue) => handleStorageProviderChange(config, newValue)}
                            isLoading={updateMutation.isPending}
                          />
                        ) : config.config_key === 'backup_folder_path' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBackupFolderEdit(config)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : config.config_key === 'backup_schedule_time_ist' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBackupTimeEdit(config)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : config.config_key === 'backup_notification_email' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNotificationEmailEdit(config)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : config.config_key === 'transport_vendors' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsTransportVendorsDialogOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : config.config_key === 'expense_groups' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExpenseGroupsDialogOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : config.config_key === 'tentative_delivery_days' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsTentativeDeliveryDaysDialogOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : config.config_key === 'whatsapp_api_key' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsWhatsAppApiKeyDialogOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Info - counts only configs in this section (excludes WhatsApp & Backup) */}
          {filteredConfigurations.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Showing {filteredConfigurations.length} configuration{filteredConfigurations.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Backup
          </CardTitle>
          <CardDescription>
            Manage database backup settings and view backup logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Backup Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setIsBackupLogsOpen(true)}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                View Backup Logs
              </Button>
              <Button
                onClick={handleManualBackup}
                disabled={isRunningBackup}
                className="flex items-center gap-2"
              >
                {isRunningBackup ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running Backup...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Backup Now
                  </>
                )}
              </Button>
            </div>

            {/* Backup Info */}
            {backupConfig && (
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Backup Folder:</strong> {backupConfig.backup_folder_path}</p>
                <p><strong>Notification Email:</strong> {backupConfig.backup_notification_email}</p>
                <p><strong>Status:</strong> {backupConfig.backup_enabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Folder Path Dialog */}
      {editingConfig && editingConfig.config_key === 'invoice_folder_path' && (
        <EditFolderPathDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          currentPath={editingConfig.config_value}
          onSave={handleSaveFolderPath}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Backup Logs Dialog */}
      <BackupLogsDialog
        open={isBackupLogsOpen}
        onOpenChange={setIsBackupLogsOpen}
      />

      {/* Edit Backup Folder Dialog */}
      {editingConfig && editingConfig.config_key === 'backup_folder_path' && backupConfig && (
        <EditBackupFolderDialog
          open={isBackupFolderDialogOpen}
          onOpenChange={setIsBackupFolderDialogOpen}
          currentPath={backupConfig.backup_folder_path}
          onSuccess={handleBackupConfigRefresh}
        />
      )}

      {/* Edit Backup Time Dialog */}
      {editingConfig && editingConfig.config_key === 'backup_schedule_time_ist' && backupConfig && (
        <EditBackupTimeDialog
          open={isBackupTimeDialogOpen}
          onOpenChange={setIsBackupTimeDialogOpen}
          currentTime={backupConfig.backup_schedule_time_ist}
          onSuccess={handleBackupConfigRefresh}
        />
      )}

      {/* Edit Notification Email Dialog */}
      {editingConfig && editingConfig.config_key === 'backup_notification_email' && backupConfig && (
        <EditNotificationEmailDialog
          open={isNotificationEmailDialogOpen}
          onOpenChange={setIsNotificationEmailDialogOpen}
          currentEmail={backupConfig.backup_notification_email}
          onSuccess={handleBackupConfigRefresh}
        />
      )}

      {/* SKU's available in the plant Dialog */}
      <EditSkusAvailableDialog
        open={isSkusAvailableDialogOpen}
        onOpenChange={setIsSkusAvailableDialogOpen}
      />

      {/* Transport Vendors Dialog */}
      <EditListConfigDialog
        open={isTransportVendorsDialogOpen}
        onOpenChange={setIsTransportVendorsDialogOpen}
        configKey="transport_vendors"
        title="Transport Vendors"
        description="Add or remove transport vendors. These appear in the Transport expenses dropdown."
        placeholder="e.g. ABC Logistics"
      />

      {/* Expense Groups Dialog */}
      <EditListConfigDialog
        open={isExpenseGroupsDialogOpen}
        onOpenChange={setIsExpenseGroupsDialogOpen}
        configKey="expense_groups"
        title="Expense Groups"
        description="Add or remove expense groups. These appear in the Transport expenses dropdown."
        placeholder="e.g. Delivery, Fuel"
      />

      {/* Tentative Delivery Days Dialog */}
      <EditTentativeDeliveryDaysDialog
        open={isTentativeDeliveryDaysDialogOpen}
        onOpenChange={setIsTentativeDeliveryDaysDialogOpen}
      />

      {/* Purchase Items Dialog */}
      <EditListConfigDialog
        open={isPurchaseItemsDialogOpen}
        onOpenChange={setIsPurchaseItemsDialogOpen}
        configKey="purchase_items"
        title="Item List for Purchase"
        description="Add or remove items for the Purchase page dropdown (e.g. Preforms, Caps, Shrink)."
        placeholder="e.g. Preforms, Caps, Shrink"
      />

      {/* WhatsApp API Key Dialog */}
      <EditWhatsAppApiKeyDialog
        open={isWhatsAppApiKeyDialogOpen}
        onOpenChange={setIsWhatsAppApiKeyDialogOpen}
      />
    </div>
  );
};

export default ApplicationConfigurationTab;
