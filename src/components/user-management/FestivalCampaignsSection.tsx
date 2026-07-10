import React, { useState, useMemo } from 'react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { getWhatsAppTemplates } from '@/services/whatsappService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { importExcelJS } from '@/lib/heavyImports';
import {
  Loader2,
  Upload,
  X,
  CalendarClock,
  Users,
  ChevronDown,
  ChevronRight,
  Image,
  Video,
  CheckSquare,
  Square,
  Info,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface ContactRow {
  client_name: string;
  branch: string;
  contact_name: string;
  phone: string;
  role: string;
}

interface CustomerRow {
  client_name: string;
  branch: string;
  whatsapp_number: string;
}

interface GroupedClient {
  client_name: string;
  branch: string;
  contacts: ContactRow[];
  directPhone?: string; // set when client has no contacts — uses customer's whatsapp_number
}

interface FestivalCampaign {
  id: string;
  name: string;
  template_id: string | null;
  template_name: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  media_filename: string | null;
  scheduled_at: string;
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const recipientKey = (c: ContactRow) =>
  `${c.client_name}|${c.branch}|${c.contact_name}|${c.phone}`;

const STATUS_BADGE: Record<FestivalCampaign['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Scheduled', variant: 'outline' },
  sending:   { label: 'Sending…',  variant: 'secondary' },
  sent:      { label: 'Sent',      variant: 'default' },
  failed:    { label: 'Failed',    variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};

function formatLocal(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// ── Campaign recipients detail ─────────────────────────────────────────────

interface RecipientRow {
  id: string;
  client_name: string;
  branch: string;
  contact_name: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed';
  error_msg: string | null;
  sent_at: string | null;
}

type SortKey = 'status' | 'client_name' | 'branch' | 'contact_name' | 'phone' | 'sent_at';
type SortDir = 'asc' | 'desc';

const STATUS_COLOR: Record<RecipientRow['status'], string> = {
  sent:    'text-green-600',
  failed:  'text-red-500',
  pending: 'text-yellow-600',
};

const STATUS_BG: Record<RecipientRow['status'], string> = {
  sent:    'bg-green-50 text-green-700 border-green-200',
  failed:  'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
  return sortDir === 'asc'
    ? <ArrowUp className="h-3 w-3" />
    : <ArrowDown className="h-3 w-3" />;
}

const CampaignRecipients: React.FC<{ campaignId: string; campaignName: string }> = ({ campaignId, campaignName }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecipientRow['status'] | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [exporting, setExporting] = useState(false);

  const { data: recipients = [], isLoading } = useQuery<RecipientRow[]>({
    queryKey: ['campaign-recipients', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festival_campaign_recipients')
        .select('id, client_name, branch, contact_name, phone, status, error_msg, sent_at')
        .eq('campaign_id', campaignId);
      if (error) throw new Error(handleSupabaseError(error));
      return (data || []) as RecipientRow[];
    },
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return recipients
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) =>
        !q ||
        r.client_name.toLowerCase().includes(q) ||
        r.branch.toLowerCase().includes(q) ||
        r.contact_name.toLowerCase().includes(q) ||
        r.phone.includes(q)
      )
      .sort((a, b) => {
        const av = (a[sortKey] ?? '') as string;
        const bv = (b[sortKey] ?? '') as string;
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [recipients, search, statusFilter, sortKey, sortDir]);

  const counts = useMemo(() => ({
    sent:    recipients.filter((r) => r.status === 'sent').length,
    failed:  recipients.filter((r) => r.status === 'failed').length,
    pending: recipients.filter((r) => r.status === 'pending').length,
  }), [recipients]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const ExcelJS = await importExcelJS();
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Recipients');

      ws.columns = [
        { header: 'Status',       key: 'status',       width: 12 },
        { header: 'Client',       key: 'client_name',  width: 28 },
        { header: 'Branch',       key: 'branch',       width: 20 },
        { header: 'Contact Name', key: 'contact_name', width: 24 },
        { header: 'Phone',        key: 'phone',        width: 18 },
        { header: 'Sent At',      key: 'sent_at',      width: 22 },
        { header: 'Error',        key: 'error_msg',    width: 40 },
      ];

      // Header styling
      ws.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
        cell.alignment = { vertical: 'middle' };
      });

      // Data rows with status colour
      const STATUS_ARGB: Record<RecipientRow['status'], string> = {
        sent:    'FFD1FAE5',
        failed:  'FFFEE2E2',
        pending: 'FFFEF9C3',
      };

      for (const r of filtered) {
        const row = ws.addRow({
          status:       r.status,
          client_name:  r.client_name,
          branch:       r.branch,
          contact_name: r.contact_name,
          phone:        r.phone,
          sent_at:      r.sent_at ? new Date(r.sent_at).toLocaleString('en-IN') : '',
          error_msg:    r.error_msg ?? '',
        });
        const argb = STATUS_ARGB[r.status];
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb } };
          cell.alignment = { vertical: 'middle', wrapText: true };
        });
      }

      ws.autoFilter = { from: 'A1', to: 'G1' };

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaignName.replace(/[^a-zA-Z0-9]/g, '_')}_recipients.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center gap-2 py-3 text-muted-foreground text-xs">
      <Loader2 className="h-3 w-3 animate-spin" /> Loading recipients…
    </div>
  );

  const cols: { key: SortKey; label: string; className: string }[] = [
    { key: 'status',       label: 'Status',   className: 'w-24' },
    { key: 'client_name',  label: 'Client',   className: 'flex-1' },
    { key: 'branch',       label: 'Branch',   className: 'w-32 hidden sm:flex' },
    { key: 'contact_name', label: 'Contact',  className: 'w-36 hidden sm:flex' },
    { key: 'phone',        label: 'Phone',    className: 'w-36 hidden md:flex' },
    { key: 'sent_at',      label: 'Sent at',  className: 'w-36 hidden lg:flex' },
  ];

  return (
    <div className="space-y-3">
      {/* Summary pills + export */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'sent', 'failed', 'pending'] as const).map((s) => {
          const count = s === 'all' ? recipients.length : counts[s];
          const active = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={[
                'text-xs px-2.5 py-1 rounded-full border font-medium transition-colors',
                active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
              ].join(' ')}
            >
              {s === 'all' ? `All (${count})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${count})`}
            </button>
          );
        })}
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportExcel}
          disabled={exporting || filtered.length === 0}
          className="text-xs gap-1.5"
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Export Excel
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search client, contact, or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-xs"
      />

      {/* Table */}
      <div className="rounded border overflow-auto max-h-72">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b sticky top-0 text-xs font-medium text-muted-foreground">
          {cols.map((col) => (
            <button
              key={col.key}
              type="button"
              onClick={() => handleSort(col.key)}
              className={`flex items-center gap-1 hover:text-foreground transition-colors ${col.className}`}
            >
              {col.label}
              <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
            </button>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No recipients match the filter.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-2 px-3 py-2 border-b last:border-0 hover:bg-muted/20 text-xs">
              <span className={`w-24 flex-shrink-0`}>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-medium capitalize ${STATUS_BG[r.status]}`}>
                  {r.status}
                </span>
              </span>
              <span className="flex-1 truncate font-medium">{r.client_name}</span>
              <span className="w-32 hidden sm:block truncate text-muted-foreground">{r.branch}</span>
              <span className="w-36 hidden sm:block truncate">{r.contact_name}</span>
              <span className="w-36 hidden md:block font-mono text-muted-foreground">{r.phone}</span>
              <span className="w-36 hidden lg:block text-muted-foreground">
                {r.sent_at ? new Date(r.sent_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
              </span>
            </div>
          ))
        )}

        {/* Failed error details below table */}
        {filtered.some((r) => r.status === 'failed' && r.error_msg) && (
          <div className="border-t px-3 py-2 space-y-1">
            <p className="text-xs font-semibold text-red-600">Send errors</p>
            {filtered.filter((r) => r.status === 'failed' && r.error_msg).map((r) => (
              <p key={r.id} className="text-xs text-red-500">
                <span className="font-medium">{r.contact_name} ({r.phone})</span>: {r.error_msg}
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {recipients.length} recipients
      </p>
    </div>
  );
};

// ── Component ──────────────────────────────────────────────────────────────

export const FestivalCampaignsSection: React.FC = () => {
  const { toast } = useToast();
  const log = useAuditLog();
  const queryClient = useQueryClient();

  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [detailCampaignId, setDetailCampaignId] = useState<string | null>(null);

  // ── Queries ──

  const { data: templates = [] } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: getWhatsAppTemplates,
  });

  const festivalTemplates = useMemo(
    () => templates.filter((t) => t.message_type === 'festival' && t.is_active),
    [templates]
  );

  const selectedTemplate = useMemo(
    () => festivalTemplates.find((t) => t.id === templateId) ?? null,
    [festivalTemplates, templateId]
  );

  const { data: allContacts = [], isLoading: contactsLoading } = useQuery<ContactRow[]>({
    queryKey: ['all-client-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('client_name, branch, contact_name, phone, role')
        .eq('is_active', true)
        .order('client_name')
        .order('branch');
      if (error) throw new Error(handleSupabaseError(error));
      return (data || []) as ContactRow[];
    },
  });

  // Customers with a whatsapp_number — used as fallback for clients without contacts
  const { data: allCustomers = [] } = useQuery<CustomerRow[]>({
    queryKey: ['customers-with-whatsapp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('client_name, branch, whatsapp_number')
        .not('whatsapp_number', 'is', null)
        .neq('whatsapp_number', '')
        .order('client_name')
        .order('branch');
      if (error) throw new Error(handleSupabaseError(error));
      return (data || []) as CustomerRow[];
    },
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<FestivalCampaign[]>({
    queryKey: ['festival-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festival_campaigns')
        .select('*')
        .order('scheduled_at', { ascending: false });
      if (error) throw new Error(handleSupabaseError(error));
      return (data || []) as FestivalCampaign[];
    },
  });

  // Grouped contacts for recipient picker — contacts take priority; customers without contacts appear as a single direct recipient
  const groupedContacts = useMemo<GroupedClient[]>(() => {
    const map: Record<string, GroupedClient> = {};

    // First: all contacts from client_contacts
    for (const c of allContacts) {
      const key = `${c.client_name}|${c.branch}`;
      if (!map[key]) map[key] = { client_name: c.client_name, branch: c.branch, contacts: [] };
      map[key].contacts.push(c);
    }

    // Second: unique client+branch from customers with whatsapp_number — only if no contacts exist
    const seen = new Set<string>();
    for (const cu of allCustomers) {
      const key = `${cu.client_name}|${cu.branch}`;
      if (!map[key] && !seen.has(key)) {
        seen.add(key);
        map[key] = {
          client_name: cu.client_name,
          branch: cu.branch,
          contacts: [],
          directPhone: cu.whatsapp_number,
        };
      }
    }

    return Object.values(map).sort((a, b) => a.client_name.localeCompare(b.client_name));
  }, [allContacts, allCustomers]);

  // ── Recipient selection helpers ──

  const toggleGroup = (group: GroupedClient) => {
    const keys = group.contacts.length > 0
      ? group.contacts.map(recipientKey)
      : group.directPhone
        ? [`${group.client_name}|${group.branch}|${group.client_name}|${group.directPhone}`]
        : [];
    const allSelected = keys.every((k) => selectedRecipients.has(k));
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      if (allSelected) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  };

  const toggleContact = (contact: ContactRow) => {
    const key = recipientKey(contact);
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleExpand = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set<string>();
    for (const g of groupedContacts) {
      if (g.contacts.length > 0) {
        g.contacts.forEach((c) => all.add(recipientKey(c)));
      } else if (g.directPhone) {
        all.add(`${g.client_name}|${g.branch}|${g.client_name}|${g.directPhone}`);
      }
    }
    setSelectedRecipients(all);
  };

  const clearAll = () => setSelectedRecipients(new Set());

  // ── Media handling ──

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast({ title: 'Invalid file', description: 'Only images and videos are supported.', variant: 'destructive' });
      return;
    }
    setMediaFile(file);
    setMediaType(isImage ? 'image' : 'video');
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  // ── Schedule mutation ──

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!campaignName.trim()) throw new Error('Campaign name is required');
      if (!templateId) throw new Error('Please select a template');
      if (!scheduledAt) throw new Error('Please set a schedule date and time');
      if (selectedRecipients.size === 0) throw new Error('Please select at least one recipient');

      const scheduledIso = new Date(scheduledAt).toISOString();
      if (new Date(scheduledIso) <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      // Upload media if present
      let uploadedUrl: string | null = null;
      let uploadedFilename: string | null = null;
      if (mediaFile) {
        setUploading(true);
        const ext = mediaFile.name.split('.').pop() || '';
        const path = `${Date.now()}_${mediaFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadErr } = await supabase.storage
          .from('campaign-media')
          .upload(path, mediaFile, { contentType: mediaFile.type, upsert: true });
        setUploading(false);
        if (uploadErr) throw new Error(`Media upload failed: ${handleSupabaseError(uploadErr)}`);
        const { data: urlData } = supabase.storage.from('campaign-media').getPublicUrl(path);
        uploadedUrl = urlData.publicUrl;
        uploadedFilename = mediaFile.name;
        void ext;
      }

      // Build recipients first (deduplicated by phone) so we know the real count
      const seenPhones = new Set<string>();
      const normalizePhone = (raw: string) => {
        let p = raw.trim().replace(/\s/g, '');
        if (p && !p.startsWith('+')) p = `+91${p}`;
        return p;
      };
      type RecipientInsert = { campaign_id: string; client_name: string; branch: string; contact_name: string; phone: string };
      const recipientRowsStaging: Omit<RecipientInsert, 'campaign_id'>[] = [];

      for (const c of allContacts) {
        if (!selectedRecipients.has(recipientKey(c))) continue;
        const phone = normalizePhone(c.phone);
        if (!phone || seenPhones.has(phone)) continue;
        seenPhones.add(phone);
        recipientRowsStaging.push({ client_name: c.client_name, branch: c.branch, contact_name: c.contact_name, phone });
      }

      for (const g of groupedContacts) {
        if (g.contacts.length > 0 || !g.directPhone) continue;
        const dk = `${g.client_name}|${g.branch}|${g.client_name}|${g.directPhone}`;
        if (!selectedRecipients.has(dk)) continue;
        const phone = normalizePhone(g.directPhone);
        if (!phone || seenPhones.has(phone)) continue;
        seenPhones.add(phone);
        recipientRowsStaging.push({ client_name: g.client_name, branch: g.branch, contact_name: g.client_name, phone });
      }

      // Create campaign row with the real deduplicated count
      const { data: campaign, error: campErr } = await supabase
        .from('festival_campaigns')
        .insert({
          name: campaignName.trim(),
          template_id: templateId || null,
          template_name: selectedTemplate?.template_name ?? '',
          media_url: uploadedUrl,
          media_type: mediaType,
          media_filename: uploadedFilename,
          scheduled_at: scheduledIso,
          total_recipients: recipientRowsStaging.length,
        })
        .select('id')
        .single();
      if (campErr || !campaign) throw new Error(handleSupabaseError(campErr!));

      const recipientRows: RecipientInsert[] = recipientRowsStaging.map((r) => ({ ...r, campaign_id: campaign.id }));
      const { error: recErr } = await supabase.from('festival_campaign_recipients').insert(recipientRows);
      if (recErr) throw new Error(handleSupabaseError(recErr));
    },
    onSuccess: () => {
      log({ action: 'CREATE', entityType: 'festival_campaign', description: `Festival campaign scheduled: "${campaignName}"` });
      queryClient.invalidateQueries({ queryKey: ['festival-campaigns'] });
      toast({ title: 'Campaign scheduled', description: 'Messages will be sent at the scheduled time.' });
      // Reset form
      setCampaignName('');
      setTemplateId('');
      setScheduledAt('');
      clearMedia();
      setSelectedRecipients(new Set());
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const cancelCampaign = async (id: string) => {
    const { error } = await supabase
      .from('festival_campaigns')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: handleSupabaseError(error), variant: 'destructive' });
    } else {
      log({ action: 'UPDATE', entityType: 'festival_campaign', entityId: id, description: `Festival campaign cancelled (ID: ${id})` });
      queryClient.invalidateQueries({ queryKey: ['festival-campaigns'] });
      toast({ title: 'Campaign cancelled' });
    }
  };

  // ── Render ──

  return (
    <div className="space-y-6">

      {/* Schedule new campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Schedule Festival Campaign
          </CardTitle>
          <CardDescription>
            Select a template, add optional media, choose recipients and set a send time. The message
            will be delivered automatically at the scheduled date and time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Row 1: name + template */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Campaign name</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Diwali 2026"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Festival template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="h-10 w-full border border-border rounded px-3 text-sm bg-background text-foreground"
                aria-label="Festival template"
              >
                <option value="">— select template —</option>
                {festivalTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.template_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Template preview */}
          {selectedTemplate && (
            <div className="rounded-md bg-muted/40 border px-4 py-3 text-sm whitespace-pre-wrap text-muted-foreground">
              <p className="text-xs font-medium text-foreground mb-1">Template preview</p>
              {selectedTemplate.template_content}
            </div>
          )}

          {/* Row 2: media + schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Media upload */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Media (optional)</label>
              {mediaPreview ? (
                <div className="relative border rounded-md overflow-hidden bg-muted/20 flex items-center gap-3 p-2">
                  {mediaType === 'image' ? (
                    <img src={mediaPreview} alt="preview" className="h-14 w-14 object-cover rounded" />
                  ) : (
                    <div className="h-14 w-14 flex items-center justify-center bg-muted rounded">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{mediaFile?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{mediaType}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={clearMedia}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border border-dashed rounded-md px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload image or video</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Sent as a follow-up media message after the text.
              </p>
            </div>

            {/* Schedule */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Send at</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                Your local time · cron-job.org checks every 5 min, so ±5 min accuracy.
              </p>
            </div>
          </div>

          {/* Recipient selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Recipients
                {selectedRecipients.size > 0 && (
                  <Badge variant="secondary" className="text-xs">{selectedRecipients.size} selected</Badge>
                )}
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAll}>Select all</Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
              </div>
            </div>

            {contactsLoading ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading contacts…
              </div>
            ) : groupedContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No contacts found. Add contacts via Configurations → Manage Contacts first.
              </p>
            ) : (
              <div className="border rounded-md overflow-auto max-h-72 divide-y">
                {groupedContacts.map((group) => {
                  const gk = `${group.client_name}|${group.branch}`;
                  const expanded = expandedGroups.has(gk);
                  const hasContacts = group.contacts.length > 0;
                  const directKey = `${group.client_name}|${group.branch}|${group.client_name}|${group.directPhone}`;

                  const allChecked = hasContacts
                    ? group.contacts.every((c) => selectedRecipients.has(recipientKey(c)))
                    : !!group.directPhone && selectedRecipients.has(directKey);
                  const someChecked = hasContacts
                    ? group.contacts.some((c) => selectedRecipients.has(recipientKey(c)))
                    : allChecked;

                  return (
                    <div key={gk}>
                      {/* Group header */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 cursor-pointer select-none">
                        <button
                          type="button"
                          className="flex-shrink-0"
                          onClick={() => toggleGroup(group)}
                          aria-label={`${allChecked ? 'Deselect' : 'Select'} ${group.client_name}`}
                        >
                          {allChecked ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : someChecked ? (
                            <CheckSquare className="h-4 w-4 text-primary/50" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="flex-1 flex items-center gap-2 text-left"
                          onClick={() => hasContacts ? toggleExpand(gk) : toggleGroup(group)}
                        >
                          {hasContacts ? (
                            expanded
                              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <span className="w-3.5" />
                          )}
                          <span className="text-sm font-medium">{group.client_name}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{group.branch}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {hasContacts
                              ? `${group.contacts.length} contact${group.contacts.length !== 1 ? 's' : ''}`
                              : 'direct'}
                          </Badge>
                        </button>
                      </div>

                      {/* Contacts list (for clients with contacts) */}
                      {expanded && hasContacts && group.contacts.map((c) => {
                        const key = recipientKey(c);
                        const checked = selectedRecipients.has(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleContact(c)}
                            className="w-full flex items-center gap-3 px-6 py-1.5 hover:bg-muted/30 text-left"
                          >
                            {checked ? (
                              <CheckSquare className="h-4 w-4 text-primary flex-shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-sm">{c.contact_name}</span>
                            <span className="text-xs text-muted-foreground">{c.phone}</span>
                            <Badge variant="outline" className="text-xs ml-auto capitalize">
                              {c.role.replace('_', ' ')}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            type="button"
            onClick={() => scheduleMutation.mutate()}
            disabled={scheduleMutation.isPending || uploading}
            className="w-full sm:w-auto"
          >
            {(scheduleMutation.isPending || uploading) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {uploading ? 'Uploading media…' : 'Schedule Campaign'}
          </Button>
        </CardContent>
      </Card>

      {/* Campaigns list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No campaigns yet.</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => {
                const badge = STATUS_BADGE[c.status];
                const isExpanded = detailCampaignId === c.id;
                return (
                  <div key={c.id} className="border rounded-md overflow-hidden">
                    {/* Campaign summary row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{c.name}</span>
                          <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                          {c.media_type === 'image' && (
                            <Image className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {c.media_type === 'video' && (
                            <Video className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 space-x-3">
                          <span>{c.template_name}</span>
                          <span>·</span>
                          <span>{formatLocal(c.scheduled_at)}</span>
                          <span>·</span>
                          <span>
                            {c.status === 'scheduled' || c.status === 'sending'
                              ? `${c.total_recipients} recipient${c.total_recipients !== 1 ? 's' : ''}`
                              : `${c.sent_count}/${c.total_recipients} sent${c.failed_count > 0 ? `, ${c.failed_count} failed` : ''}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailCampaignId(isExpanded ? null : c.id)}
                          className="text-xs gap-1"
                        >
                          <List className="h-3.5 w-3.5" />
                          {isExpanded ? 'Hide log' : 'View log'}
                        </Button>
                        {c.status === 'scheduled' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => cancelCampaign(c.id)}
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Recipient log — expands inside the card */}
                    {isExpanded && (
                      <div className="border-t bg-muted/20 px-4 py-3">
                        <CampaignRecipients campaignId={c.id} campaignName={c.name} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
