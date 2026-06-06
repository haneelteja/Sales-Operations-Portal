import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnFilter } from "@/components/ui/column-filter";
import { ChevronDown, ChevronRight, Search, X, ArrowUpDown } from "lucide-react";
import { format, parseISO } from "date-fns";

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string | null;
  username: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity_type: string;
  entity_id: string | null;
  description: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
};

const PAGE_SIZE = 50;

function JsonDiff({ oldValues, newValues }: { oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null }) {
  if (!oldValues && !newValues) return null;

  const allKeys = Array.from(new Set([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ]));

  return (
    <div className="grid grid-cols-2 gap-3 text-xs mt-2">
      {oldValues && (
        <div>
          <p className="font-semibold text-muted-foreground mb-1">Before</p>
          <div className="bg-red-50 rounded p-2 space-y-1">
            {allKeys.map(k => (
              <div key={k} className="flex gap-1">
                <span className="text-muted-foreground shrink-0">{k}:</span>
                <span className="break-all">{String(oldValues[k] ?? '—')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {newValues && (
        <div>
          <p className="font-semibold text-muted-foreground mb-1">After</p>
          <div className="bg-green-50 rounded p-2 space-y-1">
            {allKeys.map(k => (
              <div key={k} className="flex gap-1">
                <span className="text-muted-foreground shrink-0">{k}:</span>
                <span className="break-all">{String(newValues[k] ?? '—')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    date: "", action: "", entity_type: "", username: "", description: "",
  });
  const [columnSorts, setColumnSorts] = useState<Record<string, 'asc' | 'desc' | null>>({
    date: 'desc', action: null, entity_type: null, username: null, description: null,
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data as AuditLog[];
    },
    staleTime: 30_000,
  });

  const handleColumnFilterChange = useCallback((col: string, val: string) => {
    setColumnFilters(prev => ({ ...prev, [col]: val }));
    setCurrentPage(1);
  }, []);

  const handleColumnSortChange = useCallback((col: string, dir: 'asc' | 'desc' | null) => {
    setColumnSorts(prev => {
      const next: Record<string, 'asc' | 'desc' | null> = Object.fromEntries(
        Object.keys(prev).map(k => [k, null])
      );
      next[col] = dir;
      return next;
    });
  }, []);

  const activeSort = Object.entries(columnSorts).find(([, v]) => v !== null);

  const filtered = useMemo(() => {
    let result = [...logs];

    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      result = result.filter(l =>
        l.description.toLowerCase().includes(s) ||
        (l.username ?? '').toLowerCase().includes(s) ||
        l.entity_type.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s)
      );
    }

    if (columnFilters.date) {
      const f = columnFilters.date.toLowerCase();
      result = result.filter(l => format(parseISO(l.created_at), 'dd MMM yyyy').toLowerCase().includes(f));
    }
    if (columnFilters.action) {
      const f = columnFilters.action.toLowerCase();
      result = result.filter(l => l.action.toLowerCase().includes(f));
    }
    if (columnFilters.entity_type) {
      const f = columnFilters.entity_type.toLowerCase();
      result = result.filter(l => l.entity_type.toLowerCase().includes(f));
    }
    if (columnFilters.username) {
      const f = columnFilters.username.toLowerCase();
      result = result.filter(l => (l.username ?? '').toLowerCase().includes(f));
    }
    if (columnFilters.description) {
      const f = columnFilters.description.toLowerCase();
      result = result.filter(l => l.description.toLowerCase().includes(f));
    }

    if (activeSort) {
      const [col, dir] = activeSort;
      result.sort((a, b) => {
        let aVal = '', bVal = '';
        if (col === 'date') { aVal = a.created_at; bVal = b.created_at; }
        else if (col === 'action') { aVal = a.action; bVal = b.action; }
        else if (col === 'entity_type') { aVal = a.entity_type; bVal = b.entity_type; }
        else if (col === 'username') { aVal = a.username ?? ''; bVal = b.username ?? ''; }
        else if (col === 'description') { aVal = a.description; bVal = b.description; }
        const cmp = aVal.localeCompare(bVal);
        return dir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [logs, debouncedSearch, columnFilters, activeSort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasFilters = !!debouncedSearch || Object.values(columnFilters).some(Boolean);

  const clearFilters = () => {
    setSearchTerm("");
    setColumnFilters({ date: "", action: "", entity_type: "", username: "", description: "" });
    setCurrentPage(1);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sortBtn = (col: string) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-1"
      onClick={() => {
        const cur = columnSorts[col];
        handleColumnSortChange(col, cur === 'asc' ? 'desc' : cur === 'desc' ? null : 'asc');
      }}
    >
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <p className="text-muted-foreground text-sm">
          {isLoading ? 'Loading…' : `Showing ${filtered.length} of ${logs.length} entries`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs…"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-9 w-64"
          />
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" /> Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>
                <div className="flex items-center gap-1">
                  Date / Time
                  {sortBtn('date')}
                  <ColumnFilter
                    dataType="text"
                    filterValue={columnFilters.date}
                    onFilterChange={v => handleColumnFilterChange('date', v as string)}
                    sortDirection={columnSorts.date}
                    onSortChange={d => handleColumnSortChange('date', d)}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Action
                  {sortBtn('action')}
                  <ColumnFilter
                    dataType="text"
                    filterValue={columnFilters.action}
                    onFilterChange={v => handleColumnFilterChange('action', v as string)}
                    sortDirection={columnSorts.action}
                    onSortChange={d => handleColumnSortChange('action', d)}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Module
                  {sortBtn('entity_type')}
                  <ColumnFilter
                    dataType="text"
                    filterValue={columnFilters.entity_type}
                    onFilterChange={v => handleColumnFilterChange('entity_type', v as string)}
                    sortDirection={columnSorts.entity_type}
                    onSortChange={d => handleColumnSortChange('entity_type', d)}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  User
                  {sortBtn('username')}
                  <ColumnFilter
                    dataType="text"
                    filterValue={columnFilters.username}
                    onFilterChange={v => handleColumnFilterChange('username', v as string)}
                    sortDirection={columnSorts.username}
                    onSortChange={d => handleColumnSortChange('username', d)}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Description
                  {sortBtn('description')}
                  <ColumnFilter
                    dataType="text"
                    filterValue={columnFilters.description}
                    onFilterChange={v => handleColumnFilterChange('description', v as string)}
                    sortDirection={columnSorts.description}
                    onSortChange={d => handleColumnSortChange('description', d)}
                  />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading logs…</TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No logs found</TableCell>
              </TableRow>
            ) : paginated.map(log => {
              const expanded = expandedRows.has(log.id);
              const hasDiff = log.old_values || log.new_values;
              const dt = parseISO(log.created_at);
              return (
                <>
                  <TableRow
                    key={log.id}
                    className={hasDiff ? "cursor-pointer hover:bg-muted/50" : undefined}
                    onClick={hasDiff ? () => toggleRow(log.id) : undefined}
                  >
                    <TableCell className="text-muted-foreground">
                      {hasDiff
                        ? (expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
                        : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">{format(dt, 'dd MMM yyyy')}</div>
                      <div className="text-xs text-muted-foreground">{format(dt, 'HH:mm:ss')}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${ACTION_COLORS[log.action] ?? ''}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {log.entity_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{log.username ?? '—'}</TableCell>
                    <TableCell className="text-sm max-w-sm">{log.description}</TableCell>
                  </TableRow>
                  {expanded && hasDiff && (
                    <TableRow key={`${log.id}-diff`} className="bg-muted/30">
                      <TableCell colSpan={6} className="px-6 pb-4">
                        <JsonDiff oldValues={log.old_values} newValues={log.new_values} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
