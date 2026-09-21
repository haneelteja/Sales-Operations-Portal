-- Close referential-integrity gaps in three tables that store UUID references
-- without FK constraints, allowing dangling references after template/log deletion.
--
-- All constraints use ON DELETE SET NULL so existing rows are never deleted as
-- a side-effect — the column is simply nulled out when the referenced row is removed.

-- 1. payment_reminder_logs.whatsapp_message_log_id → whatsapp_message_logs(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.payment_reminder_logs'::regclass
      AND conname   = 'fk_prl_whatsapp_log'
  ) THEN
    -- Null out any values that don't have a corresponding log row (defensive cleanup).
    UPDATE public.payment_reminder_logs
    SET    whatsapp_message_log_id = NULL
    WHERE  whatsapp_message_log_id IS NOT NULL
      AND  NOT EXISTS (
             SELECT 1 FROM public.whatsapp_message_logs wml
             WHERE wml.id = payment_reminder_logs.whatsapp_message_log_id
           );

    ALTER TABLE public.payment_reminder_logs
      ADD CONSTRAINT fk_prl_whatsapp_log
      FOREIGN KEY (whatsapp_message_log_id)
      REFERENCES public.whatsapp_message_logs (id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- 2. festival_campaigns.template_id → whatsapp_templates(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.festival_campaigns'::regclass
      AND conname   = 'fk_fc_template'
  ) THEN
    UPDATE public.festival_campaigns
    SET    template_id = NULL
    WHERE  template_id IS NOT NULL
      AND  NOT EXISTS (
             SELECT 1 FROM public.whatsapp_templates wt
             WHERE wt.id = festival_campaigns.template_id
           );

    ALTER TABLE public.festival_campaigns
      ADD CONSTRAINT fk_fc_template
      FOREIGN KEY (template_id)
      REFERENCES public.whatsapp_templates (id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- 3. whatsapp_message_logs.template_id → whatsapp_templates(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.whatsapp_message_logs'::regclass
      AND conname   = 'fk_wml_template'
  ) THEN
    UPDATE public.whatsapp_message_logs
    SET    template_id = NULL
    WHERE  template_id IS NOT NULL
      AND  NOT EXISTS (
             SELECT 1 FROM public.whatsapp_templates wt
             WHERE wt.id = whatsapp_message_logs.template_id
           );

    ALTER TABLE public.whatsapp_message_logs
      ADD CONSTRAINT fk_wml_template
      FOREIGN KEY (template_id)
      REFERENCES public.whatsapp_templates (id)
      ON DELETE SET NULL;
  END IF;
END;
$$;
