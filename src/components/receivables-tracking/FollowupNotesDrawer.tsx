import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Clock, Loader2, Plus, StickyNote, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchFollowupNotes, insertFollowupNote } from '@/lib/receivablesUtils';

export interface FollowupNotesDrawerProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  dealerName: string;
  branch: string;
  outstanding: number;
  currentFollowupDate: string;
}

export function FollowupNotesDrawer({
  open,
  onClose,
  customerId,
  dealerName,
  branch,
  outstanding,
  currentFollowupDate,
}: FollowupNotesDrawerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const operatorName = profile?.username || profile?.email || user?.email || 'Unknown';
  const [note, setNote] = useState('');
  const [followupDate, setFollowupDate] = useState(currentFollowupDate);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setFollowupDate(currentFollowupDate);
  }, [currentFollowupDate, open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  const { data: notes, isLoading } = useQuery({
    queryKey: ['followup-notes', customerId],
    queryFn: () => fetchFollowupNotes(customerId),
    enabled: open && !!customerId,
  });

  const handleSave = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await insertFollowupNote(customerId, trimmed, followupDate || null, operatorName);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upsertError } = await (supabase as any)
        .from('client_followups')
        .upsert(
          {
            dealer_name: dealerName,
            branch,
            comments: trimmed,
            next_followup_date: followupDate || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'dealer_name,branch' }
        );
      if (upsertError) throw upsertError;

      queryClient.invalidateQueries({ queryKey: ['followup-notes', customerId] });
      queryClient.invalidateQueries({ queryKey: ['receivables-tracking'] });
      setNote('');
      toast({ title: 'Note saved', description: 'Follow-up note logged successfully.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getFollowupStatusBadge = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - todayDate.getTime()) / 86400000);
    if (diff < 0) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    if (diff === 0) return <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">Today</Badge>;
    return <Badge className="text-xs bg-violet-100 text-violet-800 hover:bg-violet-100">{diff}d away</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex flex-col gap-1">
            <span className="font-semibold text-base">{dealerName}</span>
            {branch && <span className="text-sm font-normal text-muted-foreground">{branch}</span>}
            <span className="text-sm font-bold text-red-600">
              ₹{outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })} outstanding
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Add note form */}
        <div className="space-y-3 py-4 border-b">
          <Textarea
            ref={textareaRef}
            rows={3}
            placeholder="Add a follow-up note..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                className="pl-8 text-sm"
                value={followupDate}
                onChange={e => setFollowupDate(e.target.value)}
                title="Follow-up date"
                aria-label="Follow-up date"
              />
            </div>
            {followupDate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setFollowupDate('')}
                aria-label="Clear follow-up date"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              className="shrink-0"
              disabled={!note.trim() || saving}
              onClick={handleSave}
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                : <Plus className="h-3.5 w-3.5 mr-1" />}
              Save
            </Button>
          </div>
        </div>

        {/* Notes log */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !notes?.length ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No notes yet. Add the first one above.
            </div>
          ) : (
            notes.map((n, i) => (
              <div key={n.id} className="relative pl-6">
                {i < notes.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                )}
                <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2 flex-wrap">
                  <span>
                    {new Date(n.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {n.created_by && (
                    <span className="font-medium text-foreground/70">· {n.created_by}</span>
                  )}
                  {getFollowupStatusBadge(n.followup_date)}
                </div>
                <p className="text-sm">{n.note}</p>
                {n.followup_date && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Follow-up: {new Date(n.followup_date).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
