import React, { useState, useEffect } from "react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";

const CONTACT_ROLES = [
  { value: "store_manager", label: "Store Manager" },
  { value: "manager", label: "Manager" },
  { value: "owner", label: "Owner" },
] as const;

type ContactRole = (typeof CONTACT_ROLES)[number]["value"];

interface ContactRow {
  id?: string;
  contact_name: string;
  phone: string;
  role: ContactRole;
}

interface ClientContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  branch: string;
}

export const ClientContactsDialog: React.FC<ClientContactsDialogProps> = ({
  open,
  onOpenChange,
  clientName,
  branch,
}) => {
  const { toast } = useToast();
  const log = useAuditLog();
  const queryClient = useQueryClient();
  const [contacts, setContacts] = useState<ContactRow[]>([]);

  const { data: existingContacts, isLoading } = useQuery({
    queryKey: ["client-contacts", clientName, branch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_contacts")
        .select("id, contact_name, phone, role")
        .eq("client_name", clientName)
        .eq("branch", branch)
        .eq("is_active", true)
        .order("created_at");
      if (error) throw new Error(handleSupabaseError(error));
      return (data || []) as ContactRow[];
    },
    enabled: open && !!clientName && !!branch,
  });

  useEffect(() => {
    if (existingContacts) setContacts(existingContacts);
  }, [existingContacts]);

  useEffect(() => {
    if (!open) setContacts([]);
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Replace all contacts for this client+branch
      const { error: delErr } = await supabase
        .from("client_contacts")
        .delete()
        .eq("client_name", clientName)
        .eq("branch", branch);
      if (delErr) throw new Error(handleSupabaseError(delErr));

      const valid = contacts.filter((c) => c.contact_name.trim() && c.phone.trim());
      if (valid.length > 0) {
        const { error: insErr } = await supabase.from("client_contacts").insert(
          valid.map((c) => {
            let phone = c.phone.trim().replace(/\s/g, "");
            if (phone && !phone.startsWith("+")) phone = `+91${phone}`;
            return {
              client_name: clientName,
              branch,
              contact_name: c.contact_name.trim(),
              phone,
              role: c.role,
            };
          })
        );
        if (insErr) throw new Error(handleSupabaseError(insErr));
      }
    },
    onSuccess: () => {
      log({ action: 'UPDATE', entityType: 'client_contacts', description: `Client contacts updated for ${clientName} — ${branch}`, newValues: { client_name: clientName, branch } });
      queryClient.invalidateQueries({ queryKey: ["client-contacts", clientName, branch] });
      toast({ title: "Contacts saved" });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addContact = () =>
    setContacts((prev) => [...prev, { contact_name: "", phone: "", role: "manager" }]);

  const removeContact = (i: number) =>
    setContacts((prev) => prev.filter((_, idx) => idx !== i));

  const updateContact = (i: number, patch: Partial<ContactRow>) =>
    setContacts((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Contact persons</DialogTitle>
          <DialogDescription>
            {clientName} · {branch} — payment reminders will be sent to these contacts. If none are
            added, reminders fall back to the customer's WhatsApp number.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                No contacts added yet.
              </p>
            ) : (
              <div className="border rounded-md overflow-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[28%]">Name</TableHead>
                      <TableHead className="w-[35%]">WhatsApp phone</TableHead>
                      <TableHead className="w-[27%]">Role</TableHead>
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Input
                            value={c.contact_name}
                            onChange={(e) => updateContact(i, { contact_name: e.target.value })}
                            placeholder="Name"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="tel"
                            value={c.phone}
                            onChange={(e) => updateContact(i, { phone: e.target.value })}
                            placeholder="+919876543210"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            aria-label="Contact role"
                            value={c.role}
                            onChange={(e) =>
                              updateContact(i, { role: e.target.value as ContactRole })
                            }
                            className="h-8 w-full border border-border rounded px-2 text-sm bg-background text-foreground"
                          >
                            {CONTACT_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeContact(i)}
                            aria-label="Remove contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Button type="button" variant="outline" size="sm" onClick={addContact}>
              <Plus className="h-4 w-4 mr-2" />
              Add person
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
