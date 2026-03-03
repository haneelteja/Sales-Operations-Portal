/**
 * Production Inventory Summary
 * Shows inventory per SKU: total production - recorded sales
 * Uses factory_payables (transaction_type='production') - Sales Operations Portal.
 */

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "lucide-react";

interface InventoryBySku {
  sku: string;
  inventory: number;
}

const ProductionInventory = () => {
  // Use factory_payables production transactions (Sales Operations - no production table)
  const { data: productionRecords = [] } = useQuery({
    queryKey: ["production-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factory_payables")
        .select("sku, quantity")
        .eq("transaction_type", "production")
        .not("sku", "is", null);
      if (error) return [];
      return (data || []).map((r) => ({ sku: r.sku!, no_of_cases: r.quantity ?? 0 }));
    },
  });

  const { data: salesRecords = [] } = useQuery({
    queryKey: ["sales-transactions-for-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_transactions")
        .select("sku, quantity")
        .eq("transaction_type", "sale")
        .not("sku", "is", null);
      if (error) throw error;
      return (data || []) as { sku: string; quantity: number | null }[];
    },
  });

  const inventoryBySku: InventoryBySku[] = useMemo(() => {
    const productionMap = new Map<string, number>();
    productionRecords.forEach((r) => {
      const cur = productionMap.get(r.sku) ?? 0;
      productionMap.set(r.sku, cur + (r.no_of_cases || 0));
    });

    const salesMap = new Map<string, number>();
    salesRecords.forEach((r) => {
      if (r.sku) {
        const cur = salesMap.get(r.sku) ?? 0;
        salesMap.set(r.sku, cur + (r.quantity || 0));
      }
    });

    const allSkus = new Set([...productionMap.keys(), ...salesMap.keys()]);
    return Array.from(allSkus)
      .map((sku) => ({
        sku,
        inventory: (productionMap.get(sku) ?? 0) - (salesMap.get(sku) ?? 0),
      }))
      .sort((a, b) => a.sku.localeCompare(b.sku));
  }, [productionRecords, salesRecords]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-emerald-600" />
        <h3 className="text-sm font-semibold">Inventory</h3>
      </div>
      {inventoryBySku.length === 0 ? (
        <p className="text-sm text-muted-foreground">No production or sales data yet</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {inventoryBySku.map(({ sku, inventory }) => (
            <div
              key={sku}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                inventory < 0 ? "border-red-200 bg-red-50 text-red-700" : inventory === 0 ? "border-amber-200 bg-amber-50 text-amber-700" : "bg-muted/50"
              }`}
            >
              {sku}: <span className="text-primary font-semibold">{inventory}</span> cases
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductionInventory;
