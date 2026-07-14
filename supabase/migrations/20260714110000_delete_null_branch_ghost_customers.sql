-- Remove all ghost customer records that have NULL/empty branch.
-- These were created 2026-06-20 as import artefacts. Each one is a
-- duplicate of an existing real client+branch record.
--
-- For each ghost:
--   1. Redirect any FK references to the real (primary) record.
--   2. Delete the ghost.
--
-- Tables covered (same set as the 20260705210000_dedup_customers migration):
--   sales_transactions, label_purchases, invoices, transport_expenses,
--   client_commissions, client_followup_notes, factory_payables, orders,
--   orders_dispatch, payment_reminder_logs, whatsapp_message_logs

DO $$
DECLARE
  v_src UUID;
  v_dst UUID;
BEGIN

  -- ── 1. "The English Café" (empty branch, Active)
  --       → "The English café" Nanakramguda
  SELECT id INTO v_src FROM customers
  WHERE lower(client_name) IN ('the english café', 'the english cafe')
    AND (branch IS NULL OR branch = '')
  LIMIT 1;

  SELECT id INTO v_dst FROM customers
  WHERE lower(client_name) IN ('the english café', 'the english cafe')
    AND branch IS NOT NULL AND branch <> ''
  LIMIT 1;

  IF v_src IS NOT NULL THEN
    RAISE NOTICE '[ghost] The English Café  src=% dst=%', v_src, v_dst;
    IF v_dst IS NOT NULL AND v_src <> v_dst THEN
      UPDATE sales_transactions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE label_purchases       SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE invoices              SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE transport_expenses    SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE client_commissions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE client_followup_notes SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE factory_payables      SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders                SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders_dispatch       SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE payment_reminder_logs SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE whatsapp_message_logs SET customer_id = v_dst WHERE customer_id = v_src;
    END IF;
    DELETE FROM customers WHERE id = v_src;
    RAISE NOTICE '[ghost] Deleted The English Café empty-branch.';
  END IF;


  -- ── 2. "this is it café" (empty branch, Deprecated)
  --       → "This is it café" Sanikpuri
  SELECT id INTO v_src FROM customers
  WHERE lower(client_name) = 'this is it café'
    AND (branch IS NULL OR branch = '')
  LIMIT 1;

  SELECT id INTO v_dst FROM customers
  WHERE lower(client_name) = 'this is it café'
    AND branch IS NOT NULL AND branch <> ''
  LIMIT 1;

  IF v_src IS NOT NULL THEN
    RAISE NOTICE '[ghost] this is it café  src=% dst=%', v_src, v_dst;
    IF v_dst IS NOT NULL AND v_src <> v_dst THEN
      UPDATE sales_transactions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE label_purchases       SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE invoices              SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE transport_expenses    SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE client_commissions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE client_followup_notes SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE factory_payables      SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders                SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders_dispatch       SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE payment_reminder_logs SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE whatsapp_message_logs SET customer_id = v_dst WHERE customer_id = v_src;
    END IF;
    DELETE FROM customers WHERE id = v_src;
    RAISE NOTICE '[ghost] Deleted "this is it café" empty-branch (deprecated).';
  END IF;


  -- ── 3. "House Party" (empty branch, Inactive)
  --       → "House party" Sanikpuri
  SELECT id INTO v_src FROM customers
  WHERE lower(client_name) = 'house party'
    AND (branch IS NULL OR branch = '')
  LIMIT 1;

  SELECT id INTO v_dst FROM customers
  WHERE lower(client_name) = 'house party'
    AND branch IS NOT NULL AND branch <> ''
  LIMIT 1;

  IF v_src IS NOT NULL THEN
    RAISE NOTICE '[ghost] House Party  src=% dst=%', v_src, v_dst;
    IF v_dst IS NOT NULL AND v_src <> v_dst THEN
      UPDATE sales_transactions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE label_purchases       SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE invoices              SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE transport_expenses    SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE client_commissions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE client_followup_notes SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE factory_payables      SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders                SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders_dispatch       SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE payment_reminder_logs SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE whatsapp_message_logs SET customer_id = v_dst WHERE customer_id = v_src;
    END IF;
    DELETE FROM customers WHERE id = v_src;
    RAISE NOTICE '[ghost] Deleted "House Party" empty-branch.';
  END IF;


  -- ── 4. "Jagan pan house" (empty branch, Inactive)
  --       → "jagan Pan House" Bhoodan Pochampally
  SELECT id INTO v_src FROM customers
  WHERE lower(client_name) = 'jagan pan house'
    AND (branch IS NULL OR branch = '')
  LIMIT 1;

  SELECT id INTO v_dst FROM customers
  WHERE lower(client_name) = 'jagan pan house'
    AND branch IS NOT NULL AND branch <> ''
  LIMIT 1;

  IF v_src IS NOT NULL THEN
    RAISE NOTICE '[ghost] Jagan pan house  src=% dst=%', v_src, v_dst;
    IF v_dst IS NOT NULL AND v_src <> v_dst THEN
      UPDATE sales_transactions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE label_purchases       SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE invoices              SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE transport_expenses    SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE client_commissions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE client_followup_notes SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE factory_payables      SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders                SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders_dispatch       SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE payment_reminder_logs SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE whatsapp_message_logs SET customer_id = v_dst WHERE customer_id = v_src;
    END IF;
    DELETE FROM customers WHERE id = v_src;
    RAISE NOTICE '[ghost] Deleted "Jagan pan house" empty-branch.';
  END IF;


  -- ── 5. "Jubile Festa" (empty branch, Inactive)
  --       → "Jubile Festa inn" Jubilee Hills
  SELECT id INTO v_src FROM customers
  WHERE lower(client_name) = 'jubile festa'
    AND (branch IS NULL OR branch = '')
  LIMIT 1;

  SELECT id INTO v_dst FROM customers
  WHERE lower(client_name) LIKE 'jubile festa%'
    AND branch IS NOT NULL AND branch <> ''
  LIMIT 1;

  IF v_src IS NOT NULL THEN
    RAISE NOTICE '[ghost] Jubile Festa  src=% dst=%', v_src, v_dst;
    IF v_dst IS NOT NULL AND v_src <> v_dst THEN
      UPDATE sales_transactions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE label_purchases       SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE invoices              SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE transport_expenses    SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE client_commissions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE client_followup_notes SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE factory_payables      SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders                SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders_dispatch       SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE payment_reminder_logs SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE whatsapp_message_logs SET customer_id = v_dst WHERE customer_id = v_src;
    END IF;
    DELETE FROM customers WHERE id = v_src;
    RAISE NOTICE '[ghost] Deleted "Jubile Festa" empty-branch.';
  END IF;


  -- ── 6. "Mid Land" (empty branch, Inactive)
  --       No active primary. Redirect to "Mid land" with any branch,
  --       then delete the ghost.
  SELECT id INTO v_src FROM customers
  WHERE lower(client_name) IN ('mid land', 'midland')
    AND (branch IS NULL OR branch = '')
  LIMIT 1;

  SELECT id INTO v_dst FROM customers
  WHERE lower(client_name) IN ('mid land', 'midland')
    AND branch IS NOT NULL AND branch <> ''
  ORDER BY is_active DESC  -- prefer active if any
  LIMIT 1;

  IF v_src IS NOT NULL THEN
    RAISE NOTICE '[ghost] Mid Land  src=% dst=%', v_src, v_dst;
    IF v_dst IS NOT NULL AND v_src <> v_dst THEN
      UPDATE sales_transactions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE label_purchases       SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE invoices              SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE transport_expenses    SET client_id   = v_dst WHERE client_id   = v_src;
      UPDATE client_commissions    SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE client_followup_notes SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE factory_payables      SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders                SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE orders_dispatch       SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE payment_reminder_logs SET customer_id = v_dst WHERE customer_id = v_src;
      UPDATE whatsapp_message_logs SET customer_id = v_dst WHERE customer_id = v_src;
    END IF;
    DELETE FROM customers WHERE id = v_src;
    RAISE NOTICE '[ghost] Deleted "Mid Land" empty-branch.';
  END IF;

END;
$$;
