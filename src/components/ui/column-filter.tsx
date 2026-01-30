import React, { useState } from 'react';
import { MoreVertical, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ColumnFilterProps {
  columnKey: string;
  columnName?: string;
  label?: string; // Alternative to columnName for backward compatibility
  filterValue?: string | string[];
  value?: string | string[]; // Alternative to filterValue
  onFilterChange: (value: string | string[]) => void;
  onClearFilter?: () => void;
  sortDirection?: 'asc' | 'desc' | null;
  onSortChange: (direction: 'asc' | 'desc' | null) => void;
  dataType?: 'text' | 'date' | 'number' | 'multiselect';
  options?: string[]; // For dropdown options
  triggerClassName?: string; // Optional className for the trigger button
}

export const ColumnFilter: React.FC<ColumnFilterProps> = ({
  columnKey,
  columnName,
  label,
  filterValue,
  value,
  onFilterChange,
  onClearFilter,
  sortDirection,
  onSortChange,
  dataType = 'text',
  options = [],
  triggerClassName = ''
}) => {
  // Use label if provided, otherwise use columnName, fallback to empty string
  const displayName = label || columnName || '';
  // Use value if provided, otherwise use filterValue, fallback to empty string/array
  const currentFilterValue = value !== undefined ? value : (filterValue !== undefined ? filterValue : '');
  // Default onClearFilter to empty function if not provided
  const handleClearFilter = onClearFilter || (() => {});
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (value: string | string[]) => {
    onFilterChange(value);
  };

  const handleMultiSelectChange = (option: string, checked: boolean) => {
    const currentValues = Array.isArray(currentFilterValue) ? currentFilterValue : [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter(v => v !== option);
    }
    
    onFilterChange(newValues);
  };

  const handleClearFilterClick = () => {
    handleClearFilter();
    setIsOpen(false);
  };

  const handleSortChange = (direction: 'asc' | 'desc' | null) => {
    onSortChange(direction);
  };

  const getSortIcon = () => {
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const renderFilterInput = () => {
    if (dataType === 'date') {
      return (
        <div className="space-y-2">
          <Input
            id={`${columnKey}-filter`}
            type="date"
            value={Array.isArray(currentFilterValue) ? '' : (currentFilterValue || '')}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder="Select date"
            className="w-full"
          />
        </div>
      );
    }

    if (dataType === 'number') {
      return (
        <div className="space-y-2">
          <Input
            id={`${columnKey}-filter`}
            type="number"
            value={Array.isArray(currentFilterValue) ? '' : (currentFilterValue || '')}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder="Enter amount"
            className="w-full"
          />
        </div>
      );
    }

    if (dataType === 'multiselect' && options.length > 0) {
      const selectedValues = Array.isArray(currentFilterValue) ? currentFilterValue : [];
      return (
        <div className="space-y-2">
          <div className="max-h-48 overflow-y-auto border rounded-md p-2">
            {options.map((option) => (
              <label key={option} className="flex items-center space-x-2 py-1 hover:bg-gray-50 rounded px-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => handleMultiSelectChange(option, e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
          {selectedValues.length > 0 && (
            <div className="text-xs text-gray-500">
              {selectedValues.length} selected
            </div>
          )}
        </div>
      );
    }

    // Auto-enable multiselect when options are provided (unless explicitly text type)
    if (options.length > 0 && dataType !== 'text') {
      const selectedValues = Array.isArray(currentFilterValue) ? currentFilterValue : 
                            (currentFilterValue ? [currentFilterValue] : []);
      return (
        <div className="space-y-2">
          <div className="max-h-48 overflow-y-auto border rounded-md p-2">
            {options.map((option) => (
              <label key={option} className="flex items-center space-x-2 py-1 hover:bg-gray-50 rounded px-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => handleMultiSelectChange(option, e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
          {selectedValues.length > 0 && (
            <div className="text-xs text-gray-500">
              {selectedValues.length} selected
            </div>
          )}
        </div>
      );
    }

    // Single select dropdown (only for explicit text type with options)
    if (options.length > 0 && dataType === 'text') {
      return (
        <div className="space-y-2">
          <select
            id={`${columnKey}-filter`}
            value={Array.isArray(currentFilterValue) ? '' : (currentFilterValue || '')}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All {displayName}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Input
          id={`${columnKey}-filter`}
          type="text"
          value={Array.isArray(currentFilterValue) ? '' : (currentFilterValue || '')}
          onChange={(e) => handleFilterChange(e.target.value)}
          placeholder={`Search ${displayName.toLowerCase()}...`}
          className="w-full"
        />
      </div>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 hover:bg-gray-100 ${triggerClassName}`}
        >
          <MoreVertical className={`h-4 w-4 ${triggerClassName}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <div className="p-4 space-y-4">
          {/* Sorting Section */}
          <div className="space-y-2">
            <Label>Sort {displayName}</Label>
            <div className="flex space-x-2">
              <Button
                variant={sortDirection === 'asc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange(sortDirection === 'asc' ? null : 'asc')}
                className="flex-1"
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                Ascending
              </Button>
              <Button
                variant={sortDirection === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange(sortDirection === 'desc' ? null : 'desc')}
                className="flex-1"
              >
                <ArrowDown className="h-4 w-4 mr-1" />
                Descending
              </Button>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Filtering Section */}
          <div className="space-y-2">
            <Label>Filter {displayName}</Label>
            {renderFilterInput()}
          </div>

          {((Array.isArray(currentFilterValue) ? currentFilterValue.length > 0 : currentFilterValue) || sortDirection) && (
            <>
              <DropdownMenuSeparator />
              <div className="flex space-x-2">
                {(Array.isArray(currentFilterValue) ? currentFilterValue.length > 0 : currentFilterValue) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilterClick}
                    className="flex-1 flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Filter</span>
                  </Button>
                )}
                {sortDirection && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSortChange(null)}
                    className="flex-1 flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Sort</span>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
