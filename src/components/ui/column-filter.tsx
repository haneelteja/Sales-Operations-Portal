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
  columnName: string;
  filterValue: string | string[];
  onFilterChange: (value: string | string[]) => void;
  onClearFilter: () => void;
  sortDirection?: 'asc' | 'desc' | null;
  onSortChange: (direction: 'asc' | 'desc' | null) => void;
  dataType?: 'text' | 'date' | 'number' | 'multiselect';
  options?: string[]; // For dropdown options
}

export const ColumnFilter: React.FC<ColumnFilterProps> = ({
  columnKey,
  columnName,
  filterValue,
  onFilterChange,
  onClearFilter,
  sortDirection,
  onSortChange,
  dataType = 'text',
  options = []
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (value: string | string[]) => {
    onFilterChange(value);
  };

  const handleMultiSelectChange = (option: string, checked: boolean) => {
    const currentValues = Array.isArray(filterValue) ? filterValue : [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter(v => v !== option);
    }
    
    onFilterChange(newValues);
  };

  const handleClearFilter = () => {
    onClearFilter();
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
            value={filterValue}
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
            value={filterValue}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder="Enter amount"
            className="w-full"
          />
        </div>
      );
    }

    if (dataType === 'multiselect' && options.length > 0) {
      const selectedValues = Array.isArray(filterValue) ? filterValue : [];
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

    if (options.length > 0) {
      return (
        <div className="space-y-2">
          <select
            id={`${columnKey}-filter`}
            value={Array.isArray(filterValue) ? '' : filterValue}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All {columnName}</option>
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
          value={filterValue}
          onChange={(e) => handleFilterChange(e.target.value)}
          placeholder={`Search ${columnName.toLowerCase()}...`}
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
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <div className="p-4 space-y-4">
          {/* Sorting Section */}
          <div className="space-y-2">
            <Label>Sort {columnName}</Label>
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
            <Label>Filter {columnName}</Label>
            {renderFilterInput()}
          </div>

          {((Array.isArray(filterValue) ? filterValue.length > 0 : filterValue) || sortDirection) && (
            <>
              <DropdownMenuSeparator />
              <div className="flex space-x-2">
                {(Array.isArray(filterValue) ? filterValue.length > 0 : filterValue) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilter}
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
