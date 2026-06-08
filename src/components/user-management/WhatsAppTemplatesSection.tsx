import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Pencil, Save, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { getWhatsAppTemplates, saveWhatsAppTemplate, type WhatsAppTemplate } from '@/services/whatsappService';

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  stock_delivered: 'Stock Delivered',
  invoice: 'Invoice',
  payment_reminder: 'Payment Reminder',
  festival: 'Festival',
};

const PLACEHOLDER_HINTS: Record<string, string[]> = {
  stock_delivered: ['{customerName}', '{orderNumber}', '{deliveryDate}', '{items}'],
  invoice: ['{customerName}', '{invoiceNumber}', '{invoiceDate}', '{amount}', '{dueDate}', '{invoiceLink}'],
  payment_reminder: ['{customerName}', '{branch}', '{amount}', '{outstandingAmount}', '{invoiceCount}', '{daysOverdue}', '{oldestInvoiceDate}'],
  festival: ['{customerName}', '{contactName}'],
};

const PLACEHOLDER_DESCRIPTIONS: Record<string, { placeholder: string; description: string }[]> = {
  stock_delivered: [
    { placeholder: '{customerName}', description: 'Customer / business name' },
    { placeholder: '{orderNumber}', description: 'Order reference number' },
    { placeholder: '{deliveryDate}', description: 'Date of delivery' },
    { placeholder: '{items}', description: 'List of delivered items' },
  ],
  invoice: [
    { placeholder: '{customerName}', description: 'Customer / business name' },
    { placeholder: '{invoiceNumber}', description: 'Invoice reference number' },
    { placeholder: '{invoiceDate}', description: 'Date on the invoice' },
    { placeholder: '{amount}', description: 'Invoice amount (₹)' },
    { placeholder: '{dueDate}', description: 'Payment due date' },
    { placeholder: '{invoiceLink}', description: 'URL link to the invoice PDF' },
  ],
  payment_reminder: [
    { placeholder: '{customerName}', description: 'Customer / business name' },
    { placeholder: '{branch}', description: 'Customer branch / location' },
    { placeholder: '{amount}', description: 'Total outstanding amount (₹) — same as {outstandingAmount}' },
    { placeholder: '{outstandingAmount}', description: 'Total outstanding amount (₹) — same as {amount}' },
    { placeholder: '{invoiceCount}', description: 'Number of pending invoices' },
    { placeholder: '{daysOverdue}', description: 'Days since the oldest unpaid invoice' },
    { placeholder: '{oldestInvoiceDate}', description: 'Date of the oldest unpaid invoice' },
  ],
  festival: [
    { placeholder: '{customerName}', description: 'Customer / business name' },
    { placeholder: '{contactName}', description: 'Name of the individual contact' },
  ],
};

export const WhatsAppTemplatesSection: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [placeholderRefOpen, setPlaceholderRefOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => getWhatsAppTemplates(),
  });

  const saveMutation = useMutation({
    mutationFn: (template: Partial<WhatsAppTemplate> & { template_name: string; message_type: string; template_content: string }) =>
      saveWhatsAppTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      setEditingId(null);
      toast({ title: 'Template saved', description: 'WhatsApp template updated successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to save template', variant: 'destructive' });
    },
  });

  const startEdit = (template: WhatsAppTemplate) => {
    setEditingId(template.id);
    setEditContent(template.template_content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSave = (template: WhatsAppTemplate) => {
    saveMutation.mutate({
      id: template.id,
      template_name: template.template_name,
      message_type: template.message_type,
      template_content: editContent,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Message Templates
          </CardTitle>
          <CardDescription>No templates found in the database.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Message Templates
          </CardTitle>
          <CardDescription>
            Edit the text sent via WhatsApp for each notification type. Use placeholders in curly braces to insert dynamic values.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Placeholder Reference */}
      <Card>
        <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setPlaceholderRefOpen((o) => !o)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Available Placeholders Reference</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Use these in any template — they are replaced automatically when a message is sent.
              </CardDescription>
            </div>
            {placeholderRefOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </div>
        </CardHeader>
        {placeholderRefOpen && (
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(PLACEHOLDER_DESCRIPTIONS).map(([type, items]) => (
                <div key={type} className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {MESSAGE_TYPE_LABELS[type] ?? type}
                  </p>
                  <table className="w-full text-xs">
                    <tbody>
                      {items.map(({ placeholder, description }) => (
                        <tr key={placeholder} className="border-b last:border-0">
                          <td className="py-1 pr-3 font-mono text-blue-700 whitespace-nowrap">{placeholder}</td>
                          <td className="py-1 text-muted-foreground">{description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {templates.map((template) => {
        const isEditing = editingId === template.id;
        const hints = PLACEHOLDER_HINTS[template.message_type] ?? [];

        return (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {template.template_name}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {MESSAGE_TYPE_LABELS[template.message_type] ?? template.message_type}
                  </Badge>
                  {template.is_default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => startEdit(template)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                    placeholder="Enter message text..."
                  />
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Available placeholders: </span>
                    {hints.map((p) => (
                      <code
                        key={p}
                        className="bg-muted px-1 rounded mr-1 cursor-pointer hover:bg-muted/80"
                        onClick={() => setEditContent((prev) => prev + p)}
                      >
                        {p}
                      </code>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(template)}
                      disabled={saveMutation.isPending || !editContent.trim()}
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5 mr-1" />
                      )}
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saveMutation.isPending}>
                      <X className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <pre className="text-sm text-gray-700 bg-muted/40 rounded p-3 whitespace-pre-wrap font-sans">
                  {template.template_content}
                </pre>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
