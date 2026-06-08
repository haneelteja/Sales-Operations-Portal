import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Pencil, Save, X, Loader2 } from 'lucide-react';
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

export const WhatsAppTemplatesSection: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
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
