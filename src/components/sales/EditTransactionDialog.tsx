/**
 * EditTransactionDialog Component
 * Extracted from SalesEntry.tsx for better maintainability
 */

import { memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import type { Customer, SalesTransaction } from "@/types";

interface EditTransactionDialogProps {
  transaction: SalesTransaction;
  editForm: {
    customer_id: string;
    amount: string;
    quantity: string;
    sku: string;
    description: string;
    transaction_date: string;
    branch: string;
  };
  customers?: Customer[];
  getUniqueCustomers: string[];
  getAvailableBranchesForEdit: () => string[];
  getPricePerCaseForEdit: () => string;
  isOpen: boolean;
  isUpdating: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick: (transaction: SalesTransaction) => void;
  onEditSubmit: (e: React.FormEvent) => void;
  onFormChange: (updates: Partial<EditTransactionDialogProps['editForm']>) => void;
  onCustomerChange: (customerName: string) => void;
}

export const EditTransactionDialog = memo(({
  transaction,
  editForm,
  customers,
  getUniqueCustomers,
  getAvailableBranchesForEdit,
  getPricePerCaseForEdit,
  isOpen,
  isUpdating,
  onOpenChange,
  onEditClick,
  onEditSubmit,
  onFormChange,
  onCustomerChange,
}: EditTransactionDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEditClick(transaction)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={onEditSubmit} className="space-y-6">
          {/* First Row: Date, Customer, Branch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date *</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.transaction_date}
                onChange={(e) => onFormChange({ transaction_date: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-customer">Customer</Label>
              <Select 
                value={customers?.find(c => c.id === editForm.customer_id)?.client_name || ""} 
                onValueChange={onCustomerChange}
              >
                <SelectTrigger id="edit-customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {getUniqueCustomers.map((customerName) => (
                    <SelectItem key={customerName} value={customerName}>
                      {customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-branch">Branch</Label>
              <Select 
                value={editForm.branch} 
                onValueChange={(value) => onFormChange({ branch: value })}
                disabled={!editForm.customer_id}
              >
                <SelectTrigger id="edit-branch">
                  <SelectValue placeholder={editForm.customer_id ? "Select branch" : "Select customer first"} />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableBranchesForEdit().map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second Row: SKU, Quantity (cases), Price per Case */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={editForm.sku}
                onChange={(e) => onFormChange({ sku: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity (cases)</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={editForm.quantity}
                onChange={(e) => onFormChange({ quantity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price-per-case">Price per Case (₹)</Label>
              <Input
                id="edit-price-per-case"
                type="number"
                step="0.01"
                value={getPricePerCaseForEdit()}
                readOnly
                className="bg-gray-50"
                placeholder="Select customer and branch first"
              />
            </div>
          </div>

          {/* Third Row: Amount, Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (₹)</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => onFormChange({ amount: e.target.value })}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => onFormChange({ description: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

EditTransactionDialog.displayName = 'EditTransactionDialog';
