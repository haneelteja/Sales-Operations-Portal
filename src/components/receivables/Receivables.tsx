import React, { useState, useMemo } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSalesTransactions } from '@/hooks/useDatabase';
import { formatCurrency, formatDate } from '@/lib/form-utils';
import { Search, Filter, Download, Eye } from 'lucide-react';

interface ReceivableTransaction {
  id: string;
  customer_name: string;
  branch: string;
  sku: string;
  quantity: number;
  total_amount: number;
  transaction_date: string;
  status: 'pending' | 'paid' | 'overdue';
}

const Receivables = () => {
  const { toast } = useToast();
  const { data: salesTransactions, isLoading, error } = useSalesTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Transform sales transactions into receivables
  const receivables: ReceivableTransaction[] = salesTransactions?.map(transaction => ({
    id: transaction.id,
    customer_name: transaction.customers?.client_name || 'Unknown Customer',
    branch: transaction.customers?.branch || 'Unknown Branch',
    sku: transaction.sku,
    quantity: transaction.quantity,
    total_amount: transaction.total_amount,
    transaction_date: transaction.transaction_date,
    status: 'pending' as const // Default status, in real app this would come from the database
  })) || [];

  // Filter receivables based on search and filters (memoized for performance)
  const filteredReceivables = useMemo(() => {
    return receivables.filter(receivable => {
      const matchesSearch = receivable.customer_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           receivable.branch.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           receivable.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || receivable.status === statusFilter;
      
      const matchesDate = dateFilter === 'all' || 
        (dateFilter === 'today' && new Date(receivable.transaction_date).toDateString() === new Date().toDateString()) ||
        (dateFilter === 'week' && new Date(receivable.transaction_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
        (dateFilter === 'month' && new Date(receivable.transaction_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [receivables, debouncedSearchTerm, statusFilter, dateFilter]);

  // Calculate totals (memoized)
  const totalAmount = useMemo(() => {
    return filteredReceivables.reduce((sum, receivable) => sum + receivable.total_amount, 0);
  }, [filteredReceivables]);

  const pendingAmount = useMemo(() => {
    return filteredReceivables
      .filter(r => r.status === 'pending')
      .reduce((sum, receivable) => sum + receivable.total_amount, 0);
  }, [filteredReceivables]);

  const paidAmount = useMemo(() => {
    return filteredReceivables
      .filter(r => r.status === 'paid')
      .reduce((sum, receivable) => sum + receivable.total_amount, 0);
  }, [filteredReceivables]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleMarkAsPaid = (id: string) => {
    toast({
      title: "Success",
      description: "Receivable marked as paid successfully",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Receivables data is being exported...",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Client Receivables</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Client Receivables</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading receivables data</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Client Receivables</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">₹</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredReceivables.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">⏳</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">✅</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Successfully collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">%</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by customer, branch, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receivables Table */}
      <Card>
        <CardHeader>
          <CardTitle>Receivables List</CardTitle>
          <CardDescription>
            Manage and track client receivables
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReceivables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No receivables found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReceivables.map((receivable) => (
                <div
                  key={receivable.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="font-medium">{receivable.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{receivable.branch}</p>
                    </div>
                    <div>
                      <p className="font-medium">{receivable.sku}</p>
                      <p className="text-sm text-muted-foreground">Qty: {receivable.quantity}</p>
                    </div>
                    <div>
                      <p className="font-medium">{formatCurrency(receivable.total_amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(receivable.transaction_date)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {getStatusBadge(receivable.status)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsPaid(receivable.id)}
                        disabled={receivable.status === 'paid'}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {receivable.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(receivable.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Receivables;





