import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TransportExpense, TransportExpenseForm } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { ColumnFilter } from '@/components/ui/column-filter';

const TransportExpenses = () => {
  const [form, setForm] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    expense_group: "",
    description: "",
    amount: "",
    client_id: "",
    branch: ""
  });

  const [editingExpense, setEditingExpense] = useState<TransportExpense | null>(null);
  const [editForm, setEditForm] = useState({
    expense_date: "",
    expense_group: "",
    description: "",
    amount: "",
    client_id: "",
    branch: ""
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState({
    date: "",
    description: "",
    group: "",
    amount: "",
    client: "",
    branch: ""
  });
  const [columnSorts, setColumnSorts] = useState<{[key: string]: 'asc' | 'desc' | null}>({
    date: null,
    description: null,
    group: null,
    amount: null,
    client: null,
    branch: null
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("is_active", true)
        .order("client_name", { ascending: true });
      return data || [];
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["transport-expenses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transport_expenses")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });


  const mutation = useMutation({
    mutationFn: async (data: TransportExpenseForm) => {
      const { error } = await supabase
        .from("transport_expenses")
        .insert({
          expense_date: data.expense_date,
          expense_group: data.expense_group || null,
          amount: parseFloat(data.amount),
          description: data.description || "",
          client_id: data.client_id,
          branch: data.branch
        });

      if (error) {
        console.error("Transport expense insert error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transport expense recorded!" });
      setForm({
        expense_date: new Date().toISOString().split('T')[0],
        expense_group: "",
        description: "",
        amount: ""
      });
      queryClient.invalidateQueries({ queryKey: ["transport-expenses"] });
    },
    onError: (error: unknown) => {
      toast({ 
        title: "Error", 
        description: "Failed to record expense: " + (error instanceof Error ? error.message : ''),
        variant: "destructive"
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<TransportExpenseForm>) => {
      const { error } = await supabase
        .from("transport_expenses")
        .update({
          expense_date: data.expense_date,
          expense_group: data.expense_group || null,
          amount: data.amount ? parseFloat(data.amount) : undefined,
          description: data.description || "",
          client_id: data.client_id,
          branch: data.branch
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transport expense updated!" });
      setIsEditDialogOpen(false);
      setEditingExpense(null);
      queryClient.invalidateQueries({ queryKey: ["transport-expenses"] });
    },
    onError: (error: unknown) => {
      toast({ 
        title: "Error", 
        description: "Failed to update expense: " + (error instanceof Error ? error.message : ''),
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transport_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transport expense deleted!" });
      queryClient.invalidateQueries({ queryKey: ["transport-expenses"] });
    },
    onError: (error: unknown) => {
      toast({ 
        title: "Error", 
        description: "Failed to delete expense: " + (error instanceof Error ? error.message : ''),
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.amount || !form.client_id || !form.branch) {
      toast({ 
        title: "Error", 
        description: "Amount, Client, and Branch are required",
        variant: "destructive"
      });
      return;
    }
    
    mutation.mutate(form);
  };

  const handleEditClick = (expense: TransportExpense) => {
    setEditingExpense(expense);
    setEditForm({
      expense_date: expense.expense_date,
      expense_group: expense.expense_group || "",
      description: expense.description || "",
      amount: expense.amount?.toString() || "",
      client_id: expense.client_id || "",
      branch: expense.branch || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.amount || !editForm.client_id || !editForm.branch) {
      toast({ 
        title: "Error", 
        description: "Amount, Client, and Branch are required",
        variant: "destructive"
      });
      return;
    }
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, ...editForm });
    }
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transport expense?")) {
      deleteMutation.mutate(id);
    }
  };

  // Get unique customers (case-insensitive)
  const getUniqueCustomers = () => {
    if (!customers) return [];
    
    const seenCustomers = new Set<string>();
    const uniqueCustomers: typeof customers = [];
    
    customers.forEach(customer => {
      if (customer.client_name && customer.client_name.trim() !== '') {
        const trimmedName = customer.client_name.trim();
        const lowerCaseName = trimmedName.toLowerCase();
        
        // Only add if we haven't seen this customer name (case-insensitive) before
        if (!seenCustomers.has(lowerCaseName)) {
          seenCustomers.add(lowerCaseName);
          uniqueCustomers.push(customer);
        }
      }
    });
    
    return uniqueCustomers.sort((a, b) => a.client_name.localeCompare(b.client_name));
  };

  // Get available branches for a selected customer
  const getAvailableBranches = (customerId: string) => {
    if (!customers) return [];
    return customers.filter(c => c.id === customerId).map(c => c.branch).filter(Boolean);
  };

  // Get unique groups for filtering
  const getUniqueGroups = () => {
    if (!expenses) return [];
    return [...new Set(expenses.map(e => e.expense_group).filter(Boolean))].sort();
  };

  // Handle column filter change
  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  };

  // Handle column sort change
  const handleColumnSortChange = (column: string, direction: 'asc' | 'desc' | null) => {
    setColumnSorts(prev => {
      const newSorts = { ...prev };
      // Reset other sorts
      Object.keys(newSorts).forEach(key => {
        if (key !== column) newSorts[key] = null;
      });
      newSorts[column] = direction;
      return newSorts;
    });
  };

  // Handle clear column filter
  const handleClearColumnFilter = (column: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: "" }));
  };

  // Filter and sort expenses
  const filteredAndSortedExpenses = expenses?.filter((expense) => {
    const expenseGroup = expense.expense_group || '';
    const amount = expense.amount?.toString() || '';
    const date = new Date(expense.expense_date).toLocaleDateString();
    const dateISO = expense.expense_date;
    const description = expense.description || '';
    
    // Get client and branch names for filtering
    const clientName = expense.client_name?.toLowerCase() || '';
    const branchName = expense.branch?.toLowerCase() || '';
    
    // Global search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesGlobalSearch = (
        description.toLowerCase().includes(searchLower) ||
        expenseGroup.toLowerCase().includes(searchLower) ||
        amount.includes(searchLower) ||
        date.includes(searchLower) ||
        clientName.includes(searchLower) ||
        branchName.includes(searchLower)
      );
      if (!matchesGlobalSearch) return false;
    }
    
    // Column-specific filters
    if (columnFilters.date && dateISO !== columnFilters.date) return false;
    if (columnFilters.description && !description.toLowerCase().includes(columnFilters.description.toLowerCase())) return false;
    if (columnFilters.group && !expenseGroup.toLowerCase().includes(columnFilters.group.toLowerCase())) return false;
    if (columnFilters.amount && !amount.includes(columnFilters.amount)) return false;
    if (columnFilters.client && !clientName.includes(columnFilters.client.toLowerCase())) return false;
    if (columnFilters.branch && !branchName.includes(columnFilters.branch.toLowerCase())) return false;
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    const activeSort = Object.entries(columnSorts).find(([_, direction]) => direction !== null);
    if (!activeSort) return 0;

    const [columnKey, direction] = activeSort;
    let valueA: string | number, valueB: string | number;

    switch (columnKey) {
      case 'date':
        valueA = new Date(a.expense_date).getTime();
        valueB = new Date(b.expense_date).getTime();
        break;
      case 'description':
        valueA = a.description || '';
        valueB = b.description || '';
        break;
      case 'group':
        valueA = a.expense_group || '';
        valueB = b.expense_group || '';
        break;
      case 'amount':
        valueA = a.amount || 0;
        valueB = b.amount || 0;
        break;
      case 'client':
        valueA = a.client_name || '';
        valueB = b.client_name || '';
        break;
      case 'branch':
        valueA = a.branch || '';
        valueB = b.branch || '';
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  }) || [];

  const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;


  // Export filtered data to Excel
  const exportToExcel = () => {
    const exportData = filteredAndSortedExpenses.map((expense) => {
      return {
        'Date': new Date(expense.expense_date).toLocaleDateString(),
        'Client': expense.client_name || '',
        'Branch': expense.branch || '',
        'Group': expense.expense_group || '',
        'Amount (₹)': expense.amount || 0,
        'Description': expense.description || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transport Expenses');
    
    const fileName = `Transport_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Export Successful",
      description: `Exported ${exportData.length} transport expenses to ${fileName}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">Total Transport Expenses</span>
          <span className="text-lg font-bold text-blue-600">₹{totalExpenses.toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expense-date">Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm({...form, expense_date: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount (₹) *</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({...form, amount: e.target.value})}
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expense-description">Description *</Label>
            <Input
              id="expense-description"
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Enter expense description"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={form.client_id} onValueChange={(value) => setForm({ ...form, client_id: value, branch: "" })}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueCustomers().map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">Branch *</Label>
            <Select value={form.branch} onValueChange={(value) => setForm({ ...form, branch: value })} disabled={!form.client_id}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableBranches(form.client_id).map((branch, index) => (
                  <SelectItem key={index} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-group">Expense Group</Label>
            <Input
              id="expense-group"
              value={form.expense_group}
              onChange={(e) => setForm({...form, expense_group: e.target.value})}
              placeholder="e.g., Delivery, Fuel, etc."
            />
          </div>
        </div>
        
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Recording..." : "Record Expense"}
        </Button>
      </form>

      {/* Transport Transactions Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Transport Transactions</h3>
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedExpenses.length} of {expenses?.length || 0} transactions
            </span>
          </div>
          <Button
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </Button>
        </div>
        
        {/* Search Filter */}
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search transactions by client, branch, group, amount, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          {(searchTerm || Object.values(columnFilters).some(filter => filter) || Object.values(columnSorts).some(sort => sort !== null)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setColumnFilters({
                  date: "",
                  client: "",
                  branch: "",
                  group: "",
                  amount: ""
                });
                setColumnSorts({
                  date: null,
                  client: null,
                  branch: null,
                  group: null,
                  amount: null
                });
              }}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 border-b border-slate-200">
            <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-left border-r border-slate-200/50">
              <div className="flex items-center justify-between">
                <span>Date</span>
                <ColumnFilter
                  columnKey="date"
                  columnName="Date"
                  filterValue={columnFilters.date}
                  onFilterChange={(value) => handleColumnFilterChange('date', value)}
                  onClearFilter={() => handleClearColumnFilter('date')}
                  sortDirection={columnSorts.date}
                  onSortChange={(direction) => handleColumnSortChange('date', direction)}
                  dataType="date"
                />
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-left border-r border-slate-200/50">
              <div className="flex items-center justify-between">
                <span>Client</span>
                <ColumnFilter
                  columnKey="client"
                  columnName="Client"
                  filterValue={columnFilters.client || ""}
                  onFilterChange={(value) => handleColumnFilterChange('client', value)}
                  onClearFilter={() => handleClearColumnFilter('client')}
                  sortDirection={columnSorts.client || null}
                  onSortChange={(direction) => handleColumnSortChange('client', direction)}
                  dataType="text"
                />
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-left border-r border-slate-200/50">
              <div className="flex items-center justify-between">
                <span>Branch</span>
                <ColumnFilter
                  columnKey="branch"
                  columnName="Branch"
                  filterValue={columnFilters.branch || ""}
                  onFilterChange={(value) => handleColumnFilterChange('branch', value)}
                  onClearFilter={() => handleClearColumnFilter('branch')}
                  sortDirection={columnSorts.branch || null}
                  onSortChange={(direction) => handleColumnSortChange('branch', direction)}
                  dataType="text"
                />
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-center border-r border-slate-200/50">
              <div className="flex items-center justify-between">
                <span>Group</span>
                <ColumnFilter
                  columnKey="group"
                  columnName="Group"
                  filterValue={columnFilters.group}
                  onFilterChange={(value) => handleColumnFilterChange('group', value)}
                  onClearFilter={() => handleClearColumnFilter('group')}
                  sortDirection={columnSorts.group}
                  onSortChange={(direction) => handleColumnSortChange('group', direction)}
                  dataType="text"
                  options={getUniqueGroups()}
                />
              </div>
            </TableHead>
            <TableHead className="text-right font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 border-r border-slate-200/50">
              <div className="flex items-center justify-end">
                <span>Amount</span>
                <ColumnFilter
                  columnKey="amount"
                  columnName="Amount"
                  filterValue={columnFilters.amount}
                  onFilterChange={(value) => handleColumnFilterChange('amount', value)}
                  onClearFilter={() => handleClearColumnFilter('amount')}
                  sortDirection={columnSorts.amount}
                  onSortChange={(direction) => handleColumnSortChange('amount', direction)}
                  dataType="number"
                />
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4 text-left border-r border-slate-200/50">
              <div className="flex items-center justify-between">
                <span>Description</span>
                <ColumnFilter
                  columnKey="description"
                  columnName="Description"
                  filterValue={columnFilters.description || ""}
                  onFilterChange={(value) => handleColumnFilterChange('description', value)}
                  onClearFilter={() => handleClearColumnFilter('description')}
                  sortDirection={columnSorts.description || null}
                  onSortChange={(direction) => handleColumnSortChange('description', direction)}
                  dataType="text"
                />
              </div>
            </TableHead>
            <TableHead className="text-right font-semibold text-slate-700 text-xs uppercase tracking-widest py-3 px-4">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedExpenses.length > 0 ? (
            filteredAndSortedExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                <TableCell>{expense.client_name || 'N/A'}</TableCell>
                <TableCell>{expense.branch || 'N/A'}</TableCell>
                <TableCell>{expense.expense_group || 'N/A'}</TableCell>
                <TableCell className="text-right font-medium">₹{expense.amount?.toLocaleString()}</TableCell>
                <TableCell>{expense.description || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(expense)}
                      title="Edit expense"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(expense.id)}
                      title="Delete expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No transactions found matching your search" : "No transport transactions found"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Transport Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expense-date">Date</Label>
                <Input
                  id="edit-expense-date"
                  type="date"
                  value={editForm.expense_date}
                  onChange={(e) => setEditForm({...editForm, expense_date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount (₹) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Input
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Enter expense description"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-client">Client *</Label>
                <Select value={editForm.client_id} onValueChange={(value) => setEditForm({ ...editForm, client_id: value, branch: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueCustomers().map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-branch">Branch *</Label>
                <Select value={editForm.branch} onValueChange={(value) => setEditForm({ ...editForm, branch: value })} disabled={!editForm.client_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableBranches(editForm.client_id).map((branch, index) => (
                      <SelectItem key={index} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expense-group">Expense Group</Label>
                <Input
                  id="edit-expense-group"
                  value={editForm.expense_group}
                  onChange={(e) => setEditForm({...editForm, expense_group: e.target.value})}
                  placeholder="e.g., Delivery, Fuel, etc."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransportExpenses;