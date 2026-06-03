import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RotateCcw, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  client_name: string;
  branch: string | null;
  is_deprecated: boolean;
}

interface LabelStock {
  client_id: string;
  total: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeprecatedClientsDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: allCustomers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["all-customers-for-deprecation"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, client_name, branch, is_deprecated")
        .order("client_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: labelStocks = [] } = useQuery<LabelStock[]>({
    queryKey: ["label-stocks-for-deprecated"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_purchases")
        .select("client_id, quantity");
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        if (row.client_id) {
          map.set(row.client_id, (map.get(row.client_id) ?? 0) + (row.quantity ?? 0));
        }
      }
      return [...map.entries()].map(([client_id, total]) => ({ client_id, total }));
    },
  });

  const labelStockMap = new Map(labelStocks.map((l) => [l.client_id, l.total]));

  const deprecated = allCustomers.filter((c) => c.is_deprecated);
  const active = allCustomers.filter((c) => !c.is_deprecated);

  const filteredActive = search.trim()
    ? active.filter(
        (c) =>
          c.client_name.toLowerCase().includes(search.toLowerCase()) ||
          (c.branch ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const setDeprecated = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_deprecated: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { value }) => {
      queryClient.invalidateQueries({ queryKey: ["all-customers-for-deprecation"] });
      queryClient.invalidateQueries({ queryKey: ["deprecated-clients"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: value ? "Client deprecated" : "Client restored",
        description: value
          ? "Client hidden from analysis tables and entry forms."
          : "Client is now active again.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Deprecated Clients</DialogTitle>
          <DialogDescription>
            Deprecated clients are hidden from Order Analysis, Client Analysis, and entry forms.
            Their transaction history remains visible. They appear in Receivables only if outstanding &gt; 0.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 overflow-auto flex-1 min-h-0">

            {/* Currently deprecated */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Currently Deprecated ({deprecated.length})
              </p>
              {deprecated.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">No deprecated clients yet.</p>
              ) : (
                <div className="border rounded-md overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Client</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead className="text-right">Label Stock</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deprecated.map((c) => {
                        const stock = labelStockMap.get(c.id) ?? 0;
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.client_name}</TableCell>
                            <TableCell className="text-muted-foreground">{c.branch || "—"}</TableCell>
                            <TableCell className="text-right">
                              {stock > 0 ? (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
                                  {stock.toLocaleString("en-IN")} labels
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeprecated.mutate({ id: c.id, value: false })}
                                disabled={setDeprecated.isPending}
                                className="gap-1.5"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Revert
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Add to deprecated */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Deprecate a Client</p>
              <Input
                placeholder="Search by client name or branch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2"
              />
              {search.trim() && (
                <div className="border rounded-md overflow-auto max-h-56">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Client</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActive.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                            No active clients match "{search}"
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredActive.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.client_name}</TableCell>
                            <TableCell className="text-muted-foreground">{c.branch || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDeprecated.mutate({ id: c.id, value: true });
                                  setSearch("");
                                }}
                                disabled={setDeprecated.isPending}
                                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                Deprecate
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!search.trim() && (
                <p className="text-xs text-muted-foreground px-1">
                  Start typing to search active clients and mark them as deprecated.
                </p>
              )}
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
