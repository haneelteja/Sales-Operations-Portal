// Filter Panel Component with Saved Filters Support
import React, { useState } from 'react';
import { 
  Filter, 
  X, 
  Plus, 
  Save, 
  Trash2, 
  Copy, 
  Star,
  StarOff,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import type { SearchModule, FilterCondition, SearchOperator } from '@/types/search';
import { SEARCH_CONFIGS } from '@/types/search';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FilterPanelProps {
  module: SearchModule;
  className?: string;
  onFiltersChange?: (filters: unknown) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  module,
  className,
  onFiltersChange,
}) => {
  const config = SEARCH_CONFIGS[module];
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);

  const {
    savedFilters,
    defaultFilter,
    saveFilter,
    deleteFilter,
    duplicateFilter,
    updateFilter,
  } = useSavedFilters(module);

  const {
    searchQuery,
    addFilterCondition,
    removeFilterCondition,
    updateFilterCondition,
    setFilters,
    clearFilters,
  } = useAdvancedSearch({
    module,
    defaultFilters: defaultFilter?.filter,
  });

  const currentFilters = searchQuery.filters || { conditions: [], logic: 'AND', module };

  const handleAddFilter = () => {
    const firstField = config.fields.find(f => f.filterable);
    if (firstField) {
      addFilterCondition({
        field: firstField.name,
        operator: 'equals',
        value: '',
      });
    }
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;

    saveFilter({
      name: filterName,
      module,
      filter: currentFilters,
      description: filterDescription,
      isShared: false,
      isDefault: false,
    });

    setFilterName('');
    setFilterDescription('');
    setShowSaveDialog(false);
  };

  const handleLoadFilter = (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (filter) {
      setFilters(filter.filter);
      setSelectedFilterId(filterId);
    }
  };

  const handleDeleteFilter = (filterId: string) => {
    if (confirm('Are you sure you want to delete this saved filter?')) {
      deleteFilter(filterId);
      if (selectedFilterId === filterId) {
        clearFilters();
        setSelectedFilterId(null);
      }
    }
  };

  const handleSetDefault = (filterId: string, isDefault: boolean) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (filter) {
      updateFilter({
        id: filterId,
        updates: { isDefault },
      });
    }
  };

  const getOperatorsForField = (fieldName: string): SearchOperator[] => {
    const field = config.fields.find(f => f.name === fieldName);
    if (!field) return ['equals', 'not_equals'];
    
    switch (field.type) {
      case 'text':
        return ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_null', 'is_not_null'];
      case 'number':
        return ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'between', 'is_null', 'is_not_null'];
      case 'date':
        return ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'between', 'is_null', 'is_not_null'];
      case 'boolean':
        return ['equals', 'is_null', 'is_not_null'];
      case 'select':
      case 'multiselect':
        return ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'];
      default:
        return ['equals', 'not_equals'];
    }
  };

  const renderFilterInput = (condition: FilterCondition, index: number) => {
    const field = config.fields.find(f => f.name === condition.field);
    if (!field) return null;

    const operators = getOperatorsForField(condition.field);

    switch (field.type) {
      case 'boolean':
        return (
          <Select
            value={String(condition.value)}
            onValueChange={(value) => updateFilterCondition(index, { value: value === 'true' })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'select':
        return (
          <Select
            value={String(condition.value || '')}
            onValueChange={(value) => updateFilterCondition(index, { value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={condition.value as string || ''}
              onChange={(e) => updateFilterCondition(index, { value: e.target.value })}
              className="w-40"
            />
            {condition.operator === 'between' && (
              <Input
                type="date"
                value={condition.value2 as string || ''}
                onChange={(e) => updateFilterCondition(index, { value2: e.target.value })}
                className="w-40"
              />
            )}
          </div>
        );

      case 'number':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={condition.value as number || ''}
              onChange={(e) => updateFilterCondition(index, { value: parseFloat(e.target.value) || 0 })}
              className="w-32"
            />
            {condition.operator === 'between' && (
              <Input
                type="number"
                value={condition.value2 as number || ''}
                onChange={(e) => updateFilterCondition(index, { value2: parseFloat(e.target.value) || 0 })}
                className="w-32"
              />
            )}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={condition.value as string || ''}
            onChange={(e) => updateFilterCondition(index, { value: e.target.value })}
            className="w-48"
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filters</h3>
          {currentFilters.conditions.length > 0 && (
            <Badge variant="secondary">{currentFilters.conditions.length}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentFilters.conditions.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {currentFilters.conditions.length > 0 && (
        <div className="space-y-2">
          {currentFilters.conditions.map((condition, index) => {
            const field = config.fields.find(f => f.name === condition.field);
            return (
              <Card key={`${condition.field}-${condition.operator}-${index}`} className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateFilterCondition(index, { field: value, operator: 'equals', value: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.fields
                          .filter(f => f.filterable)
                          .map((f) => (
                            <SelectItem key={f.name} value={f.name}>
                              {f.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateFilterCondition(index, { operator: value as SearchOperator })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorsForField(condition.field).map((op) => (
                          <SelectItem key={op} value={op}>
                            {op.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="col-span-2">
                      {renderFilterInput(condition, index)}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilterCondition(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Filter Button */}
      <Button
        variant="outline"
        onClick={handleAddFilter}
        className="w-full flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Filter
      </Button>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Saved Filters</h4>
          </div>
          <div className="space-y-1">
            {savedFilters.map((filter) => (
              <div
                key={filter.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-gray-50',
                  selectedFilterId === filter.id && 'bg-blue-50 border-blue-200'
                )}
                onClick={() => handleLoadFilter(filter.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {filter.is_default && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{filter.name}</div>
                    {filter.description && (
                      <div className="text-xs text-gray-500">{filter.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(filter.id, !filter.is_default);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    {filter.is_default ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateFilter({ id: filter.id, newName: `${filter.name} (Copy)` });
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFilter(filter.id);
                    }}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Save this filter combination for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-name">Filter Name *</Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="e.g., Active Sales This Month"
              />
            </div>
            <div>
              <Label htmlFor="filter-description">Description</Label>
              <Input
                id="filter-description"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
