import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Eye, MoreHorizontal } from 'lucide-react';
import { useMobileDetection, MOBILE_TABLE_CONFIG, MOBILE_CLASSES } from '@/lib/mobile-utils';
import { cn } from '@/lib/utils';

interface MobileTableColumn<T extends { id?: string }> {
  key: keyof T & string;
  label: string;
  priority?: number;
  mobile?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface MobileTableProps<T extends { id?: string }> {
  data: T[];
  columns: MobileTableColumn<T>[];
  className?: string;
  onRowClick?: (row: T) => void;
  expandable?: boolean;
  expandContent?: (row: T) => React.ReactNode;
}

export const MobileTable = <T extends { id?: string }>({
  data,
  columns,
  className,
  onRowClick,
  expandable = false,
  expandContent,
}: MobileTableProps<T>) => {
  const { isMobileDevice } = useMobileDetection();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpanded = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  // Filter columns for mobile
  const getVisibleColumns = () => {
    if (!isMobileDevice) return columns;
    
    return columns
      .filter(col => col.mobile !== false)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))
      .slice(0, MOBILE_TABLE_CONFIG.maxColumns);
  };

  const visibleColumns = getVisibleColumns();

  if (isMobileDevice) {
    return (
      <div className={cn("space-y-2", className)}>
        {data.map((row, index) => (
          <Card key={row.id || index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-2">
                {/* Primary information */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {visibleColumns.slice(0, 2).map((column) => (
                      <div key={column.key} className="text-sm">
                        <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">
                          {column.label}:
                        </span>
                        <div className="mt-1">
                          {column.render 
                            ? column.render(row[column.key as keyof typeof row], row as never)
                            : (row[column.key as keyof typeof row] as React.ReactNode) || '-'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    {expandable && expandContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded((row.id as string) || index.toString())}
                        className="h-8 w-8 p-0"
                      >
                        {expandedRows.has((row.id as string) || index.toString()) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {onRowClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRowClick && onRowClick(row as never)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Additional information */}
                {visibleColumns.length > 2 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    {visibleColumns.slice(2).map((column) => (
                      <div key={column.key} className="text-sm">
                        <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">
                          {column.label}:
                        </span>
                        <div className="mt-1">
                          {column.render 
                            ? column.render(row[column.key as keyof typeof row], row as never)
                            : (row[column.key as keyof typeof row] as React.ReactNode) || '-'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expandable content */}
                {expandable && expandContent && expandedRows.has((row.id as string) || index.toString()) && (
                  <div className="pt-4 border-t mt-4">
                    {expandContent(row as never)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={MOBILE_CLASSES.tableHeader}>
                {column.label}
              </TableHead>
            ))}
            {(expandable || onRowClick) && (
              <TableHead className={MOBILE_CLASSES.tableHeader}>Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id || index}>
              {columns.map((column) => (
                <TableCell key={column.key} className={MOBILE_CLASSES.tableCell}>
                  {column.render 
                    ? column.render(row[column.key as keyof typeof row], row as never)
                    : (row[column.key as keyof typeof row] as React.ReactNode) || '-'
                  }
                </TableCell>
              ))}
              {(expandable || onRowClick) && (
                <TableCell className={MOBILE_CLASSES.tableCell}>
                  <div className="flex items-center space-x-2">
                    {expandable && expandContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded((row.id as string) || index.toString())}
                        className="h-8 w-8 p-0"
                      >
                        {expandedRows.has((row.id as string) || index.toString()) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {onRowClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRowClick && onRowClick(row as never)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};




