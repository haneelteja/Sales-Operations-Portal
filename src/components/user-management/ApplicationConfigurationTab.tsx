/**
 * Application Configuration Tab
 * Manages application-level invoice-related configurations
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, RefreshCw, Edit, Settings } from 'lucide-react';
import {
  getInvoiceConfigurations,
  updateInvoiceConfiguration,
  validateFolderPath,
  type InvoiceConfiguration,
} from '@/services/invoiceConfigService';
import { EditFolderPathDialog } from './EditFolderPathDialog';
import { AutoInvoiceToggle } from './AutoInvoiceToggle';
import { StorageProviderSelect } from './StorageProviderSelect';

const ApplicationConfigurationTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConfig, setEditingConfig] = useState<InvoiceConfiguration | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch configurations
  const { data: configurations, isLoading, refetch } = useQuery({
    queryKey: ['invoice-configurations'],
    queryFn: getInvoiceConfigurations,
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

  // Filter configurations based on search query
  const filteredConfigurations = useMemo(() => {
    if (!configurations) return [];
    if (!searchQuery.trim()) return configurations;

    const query = searchQuery.toLowerCase();
    return configurations.filter((config) =>
      config.description?.toLowerCase().includes(query)
    );
  }, [configurations, searchQuery]);

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
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Invoice Configurations
          </CardTitle>
          <CardDescription>
            Manage invoice generation settings and storage paths
          </CardDescription>
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
                    <TableRow key={config.id}>
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>{config.description}</TableCell>
                      <TableCell className="text-center align-middle">
                        {config.config_key === 'invoice_folder_path' ? (
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
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Info (for future scalability) */}
          {filteredConfigurations.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Showing {filteredConfigurations.length} of {configurations?.length || 0} configurations
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Folder Path Dialog */}
      {editingConfig && (
        <EditFolderPathDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          currentPath={editingConfig.config_value}
          onSave={handleSaveFolderPath}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
};

export default ApplicationConfigurationTab;
