import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { getWhatsAppTemplates } from '@/services/whatsappService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface ContactRow {
  client_name: string;
  branch: string;
  contact_name: string;
  phone: string;
  role: string;
}

interface GroupedClient {
  client_name: string;
  branch: string;
  contacts: ContactRow[];
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

// ── Component ──────────────────────────────────────────────────────────────

export const FestivalCampaignsSection: React.FC = () => {
  const { toast } = useToast();
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

  // Grouped contacts for recipient picker
  const groupedContacts = useMemo<GroupedClient[]>(() => {
    const map: Record<string, GroupedClient> = {};
    for (const c of allContacts) {
      const key = `${c.client_name}|${c.branch}`;
      if (!map[key]) map[key] = { client_name: c.client_name, branch: c.branch, contacts: [] };
      map[key].contacts.push(c);
    }
    return Object.values(map).sort((a, b) => a.client_name.localeCompare(b.client_name));
  }, [allContacts]);

  // ── Recipient selection helpers ──

  const toggleGroup = (groupKey: string, contacts: ContactRow[]) => {
    const keys = contacts.map(recipientKey);
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
    const all = new Set(allContacts.map(recipientKey));
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

      // Create campaign row
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
          total_recipients: selectedRecipients.size,
        })
        .select('id')
        .single();
      if (campErr || !campaign) throw new Error(handleSupabaseError(campErr!));

      // Build recipients array from selected keys
      const selectedContactObjs = allContacts.filter((c) => selectedRecipients.has(recipientKey(c)));
      const recipientRows = selectedContactObjs.map((c) => {
        let phone = c.phone.trim().replace(/\s/g, '');
        if (phone && !phone.startsWith('+')) phone = `+91${phone}`;
        return {
          campaign_id: campaign.id,
          client_name: c.client_name,
          branch: c.branch,
          contact_name: c.contact_name,
          phone,
        };
      });

      const { error: recErr } = await supabase.from('festival_campaign_recipients').insert(recipientRows);
      if (recErr) throw new Error(handleSupabaseError(recErr));
    },
    onSuccess: () => {
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
                  const allChecked = group.contacts.every((c) => selectedRecipients.has(recipientKey(c)));
                  const someChecked = group.contacts.some((c) => selectedRecipients.has(recipientKey(c)));

                  return (
                    <div key={gk}>
                      {/* Group header */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 cursor-pointer select-none">
                        <button
                          type="button"
                          className="flex-shrink-0"
                          onClick={() => toggleGroup(gk, group.contacts)}
                          aria-label={`${allChecked ? 'Deselect' : 'Select'} all in ${group.client_name}`}
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
                          onClick={() => toggleExpand(gk)}
                        >
                          {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">{group.client_name}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{group.branch}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {group.contacts.length} contact{group.contacts.length !== 1 ? 's' : ''}
                          </Badge>
                        </button>
                      </div>

                      {/* Contacts list */}
                      {expanded && group.contacts.map((c) => {
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
          <CardTitle className="text-base">Scheduled Campaigns</CardTitle>
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
                return (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 border rounded-md px-4 py-3"
                  >
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cron setup info */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Cron job setup (one-time)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>
            Create a free cron job at{' '}
            <strong>cron-job.org</strong> that calls the Edge Function URL below every 5 minutes.
            It picks up any due campaigns and sends them automatically.
          </p>
          <p className="font-mono bg-muted rounded px-2 py-1 break-all select-all">
            POST &lt;your-supabase-url&gt;/functions/v1/festival-campaign-sender
          </p>
          <p>
            Add header <code>Authorization: Bearer &lt;SUPABASE_ANON_KEY&gt;</code> in the cron job settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
