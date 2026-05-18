import React from 'react';

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
  totalRecords?: number;
}

export const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  pageSize,
  onPageSizeChange,
  options = [20, 50, 100],
  totalRecords,
}) => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Rows:</span>
      <select
        value={pageSize}
        onChange={e => onPageSizeChange(Number(e.target.value))}
        className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {totalRecords !== undefined && (
        <span>of {totalRecords}</span>
      )}
    </div>
  );
};
