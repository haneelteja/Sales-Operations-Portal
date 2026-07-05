-- Deduplicate customers: redirect all FK references from stale IDs to primary, then delete stale rows.
-- Tables updated: sales_transactions, label_purchases, invoices, transport_expenses,
--   client_commissions, client_followup_notes, factory_payables, orders, orders_dispatch,
--   payment_reminder_logs, whatsapp_message_logs, _archived_label_design_costs

-- ── MACRO for merging a stale ID into a primary ──────────────────────────────
-- For each STALE record: 12 UPDATEs across all FK tables, then DELETE.
-- For "empty" records (no data): bare DELETE only.

-- ============================================================
-- Alley 91 Nanakramguda  (PRIMARY = 5a8317e2-47d0-4a1b-8fee-8aa406b10ea6)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public.label_purchases              SET client_id   = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE client_id   = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public.invoices                     SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public.transport_expenses           SET client_id   = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE client_id   = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public.client_commissions           SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public.client_followup_notes        SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public.factory_payables             SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public.orders                       SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public.orders_dispatch              SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public.payment_reminder_logs        SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public.whatsapp_message_logs        SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
UPDATE public._archived_label_design_costs SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';
DELETE FROM public.customers WHERE id = 'd0a0364b-dbdf-4145-96f8-2c1b04b7eaa3';

UPDATE public.sales_transactions           SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public.label_purchases              SET client_id   = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE client_id   = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public.invoices                     SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public.transport_expenses           SET client_id   = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE client_id   = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public.client_commissions           SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public.client_followup_notes        SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public.factory_payables             SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public.orders                       SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public.orders_dispatch              SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public.payment_reminder_logs        SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public.whatsapp_message_logs        SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = '998dada6-9f41-45ce-bd02-f55a37e0479a';
UPDATE public._archived_label_design_costs SET customer_id = '5a8317e2-47d0-4a1b-8fee-8aa406b10ea6' WHERE customer_id = '998dada6-9f41-45ce-bd02-f55a37e0479a';
DELETE FROM public.customers WHERE id = '998dada6-9f41-45ce-bd02-f55a37e0479a';

DELETE FROM public.customers WHERE id = 'fce770cc-e297-472a-bea8-42dc04e8ccdc';
DELETE FROM public.customers WHERE id = 'e716edb0-2049-482d-8a9d-7591dd463a5d';

-- ============================================================
-- Benguluru Bhavan Kondapur  (PRIMARY = 69f93fbc-ffa7-4e8c-94a7-67f16290f522)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE customer_id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public.label_purchases              SET client_id   = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE client_id   = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public.invoices                     SET customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE customer_id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public.transport_expenses           SET client_id   = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE client_id   = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public.client_commissions           SET customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE customer_id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public.client_followup_notes        SET customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE customer_id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public.factory_payables             SET customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE customer_id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public.orders                       SET customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE customer_id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public.orders_dispatch              SET customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE customer_id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public.payment_reminder_logs        SET customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE customer_id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public.whatsapp_message_logs        SET customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE customer_id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
UPDATE public._archived_label_design_costs SET customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE customer_id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';
DELETE FROM public.customers WHERE id = 'fed357eb-54a4-492c-b50b-fc9a5778b77e';

UPDATE public.label_purchases              SET client_id   = '69f93fbc-ffa7-4e8c-94a7-67f16290f522' WHERE client_id   = 'ece77129-d5b1-4d54-ba1c-8f188a32194e';
DELETE FROM public.customers WHERE id = 'ece77129-d5b1-4d54-ba1c-8f188a32194e';

-- ============================================================
-- Chaitanya's Modern Kitchen Khajaguda  (PRIMARY = 4cada784-9ab9-4f68-9571-11d59ad6af9d)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE customer_id = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public.label_purchases              SET client_id   = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE client_id   = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public.invoices                     SET customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE customer_id = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public.transport_expenses           SET client_id   = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE client_id   = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public.client_commissions           SET customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE customer_id = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public.client_followup_notes        SET customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE customer_id = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public.factory_payables             SET customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE customer_id = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public.orders                       SET customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE customer_id = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public.orders_dispatch              SET customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE customer_id = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public.payment_reminder_logs        SET customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE customer_id = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public.whatsapp_message_logs        SET customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE customer_id = '04935f42-d9ec-4ae2-b433-8737f4270eff';
UPDATE public._archived_label_design_costs SET customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d' WHERE customer_id = '04935f42-d9ec-4ae2-b433-8737f4270eff';
DELETE FROM public.customers WHERE id = '04935f42-d9ec-4ae2-b433-8737f4270eff';

-- ============================================================
-- Chandhu Poda Marriage Order Ongole  (PRIMARY = 89da408c-8181-4c21-86e0-4b33d01353f8)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE customer_id = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public.label_purchases              SET client_id   = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE client_id   = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public.invoices                     SET customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE customer_id = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public.transport_expenses           SET client_id   = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE client_id   = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public.client_commissions           SET customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE customer_id = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public.client_followup_notes        SET customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE customer_id = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public.factory_payables             SET customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE customer_id = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public.orders                       SET customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE customer_id = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public.orders_dispatch              SET customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE customer_id = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public.payment_reminder_logs        SET customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE customer_id = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public.whatsapp_message_logs        SET customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE customer_id = '952dbb60-e662-4f95-a544-bca31b17a21d';
UPDATE public._archived_label_design_costs SET customer_id = '89da408c-8181-4c21-86e0-4b33d01353f8' WHERE customer_id = '952dbb60-e662-4f95-a544-bca31b17a21d';
DELETE FROM public.customers WHERE id = '952dbb60-e662-4f95-a544-bca31b17a21d';

DELETE FROM public.customers WHERE id = 'f3f75490-b18d-474d-be4c-dbf3c7580055';

-- ============================================================
-- Deccan Kitchen Film Nagar  (PRIMARY = 9d315841-30f0-478b-8186-15186f1098a8)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '9d315841-30f0-478b-8186-15186f1098a8' WHERE customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public.label_purchases              SET client_id   = '9d315841-30f0-478b-8186-15186f1098a8' WHERE client_id   = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public.invoices                     SET customer_id = '9d315841-30f0-478b-8186-15186f1098a8' WHERE customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public.transport_expenses           SET client_id   = '9d315841-30f0-478b-8186-15186f1098a8' WHERE client_id   = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public.client_commissions           SET customer_id = '9d315841-30f0-478b-8186-15186f1098a8' WHERE customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public.client_followup_notes        SET customer_id = '9d315841-30f0-478b-8186-15186f1098a8' WHERE customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public.factory_payables             SET customer_id = '9d315841-30f0-478b-8186-15186f1098a8' WHERE customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public.orders                       SET customer_id = '9d315841-30f0-478b-8186-15186f1098a8' WHERE customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public.orders_dispatch              SET customer_id = '9d315841-30f0-478b-8186-15186f1098a8' WHERE customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public.payment_reminder_logs        SET customer_id = '9d315841-30f0-478b-8186-15186f1098a8' WHERE customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public.whatsapp_message_logs        SET customer_id = '9d315841-30f0-478b-8186-15186f1098a8' WHERE customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
UPDATE public._archived_label_design_costs SET customer_id = '9d315841-30f0-478b-8186-15186f1098a8' WHERE customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';
DELETE FROM public.customers WHERE id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee';

-- ============================================================
-- Gismat Chandha Nagar  (PRIMARY = 54bf3b3d-63c5-494d-b992-d4976fc026fb)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE customer_id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public.label_purchases              SET client_id   = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE client_id   = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public.invoices                     SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE customer_id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public.transport_expenses           SET client_id   = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE client_id   = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public.client_commissions           SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE customer_id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public.client_followup_notes        SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE customer_id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public.factory_payables             SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE customer_id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public.orders                       SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE customer_id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public.orders_dispatch              SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE customer_id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public.payment_reminder_logs        SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE customer_id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public.whatsapp_message_logs        SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE customer_id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
UPDATE public._archived_label_design_costs SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb' WHERE customer_id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';
DELETE FROM public.customers WHERE id = 'ba51ea50-6baa-47d6-aed4-5309c5dbc8c2';

DELETE FROM public.customers WHERE id = '0a7b2e11-9200-4e4f-8739-350ac119cabe';
DELETE FROM public.customers WHERE id = 'a24068ac-2a15-479a-8292-7422adf32f21';

-- ============================================================
-- Gismat Ameerpet  (PRIMARY = e209119e — all zero; delete other two empties)
-- ============================================================
DELETE FROM public.customers WHERE id = 'f1417d38-88a7-4890-8514-d563fab050a7';
DELETE FROM public.customers WHERE id = '7c7e9ad8-2d4e-49e4-8c42-b73715b8fcbf';

-- ============================================================
-- Gismat Dilshuknagar  (PRIMARY = cf3537d3 — all zero; delete other two empties)
-- ============================================================
DELETE FROM public.customers WHERE id = '8eeb276a-eb27-4343-8d16-bdafe09a7668';
DELETE FROM public.customers WHERE id = 'db08b5d4-4edd-4f70-a640-a3e514e7573f';

-- ============================================================
-- Gismat Kondapur  (PRIMARY = e9f73706-c210-4534-83c7-b03abcc2941b)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public.label_purchases              SET client_id   = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE client_id   = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public.invoices                     SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public.transport_expenses           SET client_id   = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE client_id   = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public.client_commissions           SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public.client_followup_notes        SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public.factory_payables             SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public.orders                       SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public.orders_dispatch              SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public.payment_reminder_logs        SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public.whatsapp_message_logs        SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
UPDATE public._archived_label_design_costs SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';
DELETE FROM public.customers WHERE id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed';

UPDATE public.sales_transactions           SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public.label_purchases              SET client_id   = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE client_id   = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public.invoices                     SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public.transport_expenses           SET client_id   = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE client_id   = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public.client_commissions           SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public.client_followup_notes        SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public.factory_payables             SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public.orders                       SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public.orders_dispatch              SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public.payment_reminder_logs        SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public.whatsapp_message_logs        SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c23daee9-4068-4024-b50c-50cb6bbde582';
UPDATE public._archived_label_design_costs SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b' WHERE customer_id = 'c23daee9-4068-4024-b50c-50cb6bbde582';
DELETE FROM public.customers WHERE id = 'c23daee9-4068-4024-b50c-50cb6bbde582';

-- ============================================================
-- Gismat Lakshmipuram  (PRIMARY = fd2524a0-b784-40dd-9795-d4c07d99fff7)
-- ============================================================
DELETE FROM public.customers WHERE id = 'c31942d7-ce2b-44ef-a51d-d40b618f68e8';
DELETE FROM public.customers WHERE id = '2713c6f2-998f-4d46-97ab-4ede309fde61';

-- ============================================================
-- Gismat Main Office  (PRIMARY = 805fb033-43ca-4169-8bca-7a9f5718ca80)
-- ============================================================
UPDATE public.transport_expenses           SET client_id   = '805fb033-43ca-4169-8bca-7a9f5718ca80' WHERE client_id   = 'b4edf6c5-3a65-48b9-bc88-155035a23dad';
DELETE FROM public.customers WHERE id = 'b4edf6c5-3a65-48b9-bc88-155035a23dad';

DELETE FROM public.customers WHERE id = 'b4076446-a372-485e-830d-546bbc96480b';

-- ============================================================
-- Gismat Pragathi Nagar  (PRIMARY = f1e7fb82-e889-4274-9ae3-5219a5a69fe2)
-- ============================================================
DELETE FROM public.customers WHERE id = '8c99e5ed-1eb2-43ce-8782-90dca207048d';
DELETE FROM public.customers WHERE id = '406c6ae7-3115-42a3-a2c9-6c15404b7c2a';

-- ============================================================
-- Gismat Tenali  (PRIMARY = cbacfc44-1153-4632-b1d0-76bc5efeae49)
-- ============================================================
DELETE FROM public.customers WHERE id = 'c852265e-c9d0-41b7-9ab1-1e27ed3110e1';
DELETE FROM public.customers WHERE id = '8849e1cb-873f-4b63-bd21-763032169ef7';

-- ============================================================
-- Hiyya Chrono Jail Mandi Madhapur  (PRIMARY = 4cf0c485-a5f7-4978-a311-ac3ae99d85c4)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE customer_id = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public.label_purchases              SET client_id   = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE client_id   = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public.invoices                     SET customer_id = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE customer_id = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public.transport_expenses           SET client_id   = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE client_id   = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public.client_commissions           SET customer_id = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE customer_id = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public.client_followup_notes        SET customer_id = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE customer_id = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public.factory_payables             SET customer_id = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE customer_id = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public.orders                       SET customer_id = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE customer_id = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public.orders_dispatch              SET customer_id = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE customer_id = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public.payment_reminder_logs        SET customer_id = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE customer_id = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public.whatsapp_message_logs        SET customer_id = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE customer_id = '0de6e474-d184-4d2c-931f-3d0a90488da6';
UPDATE public._archived_label_design_costs SET customer_id = '4cf0c485-a5f7-4978-a311-ac3ae99d85c4' WHERE customer_id = '0de6e474-d184-4d2c-931f-3d0a90488da6';
DELETE FROM public.customers WHERE id = '0de6e474-d184-4d2c-931f-3d0a90488da6';

-- ============================================================
-- House party Sanikpuri  (PRIMARY = 549482c2-5eb4-41db-b52b-210205fb60c0)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public.label_purchases              SET client_id   = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE client_id   = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public.invoices                     SET customer_id = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public.transport_expenses           SET client_id   = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE client_id   = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public.client_commissions           SET customer_id = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public.client_followup_notes        SET customer_id = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public.factory_payables             SET customer_id = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public.orders                       SET customer_id = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public.orders_dispatch              SET customer_id = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public.payment_reminder_logs        SET customer_id = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public.whatsapp_message_logs        SET customer_id = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
UPDATE public._archived_label_design_costs SET customer_id = '549482c2-5eb4-41db-b52b-210205fb60c0' WHERE customer_id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';
DELETE FROM public.customers WHERE id = 'f04be0ad-ed1a-4cb9-abfd-21750f9ed07b';

-- ============================================================
-- Iguru  (all zeros — delete one empty duplicate)
-- ============================================================
DELETE FROM public.customers WHERE id = '3350327d-15f6-482d-94e1-effc2cac7c64';

-- ============================================================
-- Illuzion Jubilee Hills  (PRIMARY = fb97d055-47fa-48ad-9fbf-817bfce59006)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE customer_id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public.label_purchases              SET client_id   = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE client_id   = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public.invoices                     SET customer_id = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE customer_id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public.transport_expenses           SET client_id   = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE client_id   = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public.client_commissions           SET customer_id = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE customer_id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public.client_followup_notes        SET customer_id = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE customer_id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public.factory_payables             SET customer_id = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE customer_id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public.orders                       SET customer_id = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE customer_id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public.orders_dispatch              SET customer_id = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE customer_id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public.payment_reminder_logs        SET customer_id = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE customer_id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public.whatsapp_message_logs        SET customer_id = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE customer_id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
UPDATE public._archived_label_design_costs SET customer_id = 'fb97d055-47fa-48ad-9fbf-817bfce59006' WHERE customer_id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';
DELETE FROM public.customers WHERE id = '862a2cb8-99ac-42d7-b3e0-43fdaecd75c8';

-- ============================================================
-- Intercity Bachupally  (PRIMARY = 1ee3ce8c-a487-4035-8103-abf40a3fbd12)
-- ============================================================
UPDATE public.transport_expenses           SET client_id   = '1ee3ce8c-a487-4035-8103-abf40a3fbd12' WHERE client_id   = '2e02f621-5268-43ea-8fb3-4f975050ef7a';
DELETE FROM public.customers WHERE id = '2e02f621-5268-43ea-8fb3-4f975050ef7a';

DELETE FROM public.customers WHERE id = 'ef778f02-bf19-43e2-b423-82edc6186b3b';

-- ============================================================
-- jagan Pan House Bhoodan Pochampally  (PRIMARY = 2f89a535-1fcb-4e67-9031-d1d15181e5a6)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE customer_id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public.label_purchases              SET client_id   = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE client_id   = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public.invoices                     SET customer_id = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE customer_id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public.transport_expenses           SET client_id   = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE client_id   = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public.client_commissions           SET customer_id = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE customer_id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public.client_followup_notes        SET customer_id = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE customer_id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public.factory_payables             SET customer_id = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE customer_id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public.orders                       SET customer_id = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE customer_id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public.orders_dispatch              SET customer_id = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE customer_id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public.payment_reminder_logs        SET customer_id = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE customer_id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public.whatsapp_message_logs        SET customer_id = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE customer_id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
UPDATE public._archived_label_design_costs SET customer_id = '2f89a535-1fcb-4e67-9031-d1d15181e5a6' WHERE customer_id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';
DELETE FROM public.customers WHERE id = '4131ef2a-a486-4e56-a816-c601e5c8e0a7';

-- ============================================================
-- Jubile Festa Inn Jubilee Hills  (all zeros — delete two empties)
-- ============================================================
DELETE FROM public.customers WHERE id = '653d80f0-4001-4be4-a6d4-f81a0f60ea52';
DELETE FROM public.customers WHERE id = '35eaea5f-9bb1-4e0b-b76a-4565af36101d';

-- ============================================================
-- Mid land Telangana  (PRIMARY = b886e6cc-c1f6-400c-b9be-da9b163dc4be)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public.label_purchases              SET client_id   = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE client_id   = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public.invoices                     SET customer_id = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public.transport_expenses           SET client_id   = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE client_id   = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public.client_commissions           SET customer_id = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public.client_followup_notes        SET customer_id = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public.factory_payables             SET customer_id = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public.orders                       SET customer_id = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public.orders_dispatch              SET customer_id = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public.payment_reminder_logs        SET customer_id = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public.whatsapp_message_logs        SET customer_id = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2';
UPDATE public._archived_label_design_costs SET customer_id = 'b886e6cc-c1f6-400c-b9be-da9b163dc4be' WHERE customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2';
DELETE FROM public.customers WHERE id = '52688e1f-be29-4a5a-9f20-83c245030ec2';

-- ============================================================
-- Soul of South Film Nagar  (PRIMARY = 1794596c-a254-4c0e-b8fb-f97028516116)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE customer_id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public.label_purchases              SET client_id   = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE client_id   = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public.invoices                     SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE customer_id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public.transport_expenses           SET client_id   = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE client_id   = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public.client_commissions           SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE customer_id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public.client_followup_notes        SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE customer_id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public.factory_payables             SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE customer_id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public.orders                       SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE customer_id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public.orders_dispatch              SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE customer_id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public.payment_reminder_logs        SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE customer_id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public.whatsapp_message_logs        SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE customer_id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
UPDATE public._archived_label_design_costs SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116' WHERE customer_id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';
DELETE FROM public.customers WHERE id = '4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc';

-- ============================================================
-- Sri Sri group Khammam  (PRIMARY = 110fbce5-ef08-4b26-bdb8-23a5813322d2)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE customer_id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public.label_purchases              SET client_id   = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE client_id   = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public.invoices                     SET customer_id = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE customer_id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public.transport_expenses           SET client_id   = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE client_id   = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public.client_commissions           SET customer_id = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE customer_id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public.client_followup_notes        SET customer_id = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE customer_id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public.factory_payables             SET customer_id = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE customer_id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public.orders                       SET customer_id = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE customer_id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public.orders_dispatch              SET customer_id = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE customer_id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public.payment_reminder_logs        SET customer_id = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE customer_id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public.whatsapp_message_logs        SET customer_id = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE customer_id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
UPDATE public._archived_label_design_costs SET customer_id = '110fbce5-ef08-4b26-bdb8-23a5813322d2' WHERE customer_id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';
DELETE FROM public.customers WHERE id = '42feb225-3db2-4ac2-a0ed-823c2c6face4';

-- ============================================================
-- Tara South Indian Hitech City  (PRIMARY = 8d8deae2-c9c0-452e-a08a-f14c7c66471e)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE customer_id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public.label_purchases              SET client_id   = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE client_id   = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public.invoices                     SET customer_id = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE customer_id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public.transport_expenses           SET client_id   = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE client_id   = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public.client_commissions           SET customer_id = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE customer_id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public.client_followup_notes        SET customer_id = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE customer_id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public.factory_payables             SET customer_id = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE customer_id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public.orders                       SET customer_id = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE customer_id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public.orders_dispatch              SET customer_id = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE customer_id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public.payment_reminder_logs        SET customer_id = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE customer_id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public.whatsapp_message_logs        SET customer_id = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE customer_id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
UPDATE public._archived_label_design_costs SET customer_id = '8d8deae2-c9c0-452e-a08a-f14c7c66471e' WHERE customer_id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';
DELETE FROM public.customers WHERE id = 'b11c1e24-af54-4b7b-b74c-327aaa850730';

-- ============================================================
-- Tawalogy Gandipet  (PRIMARY = 6ce0fbbb-bda1-415b-81eb-9c31ee9be062)
-- ============================================================
UPDATE public.sales_transactions           SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public.label_purchases              SET client_id   = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE client_id   = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public.invoices                     SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public.transport_expenses           SET client_id   = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE client_id   = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public.client_commissions           SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public.client_followup_notes        SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public.factory_payables             SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public.orders                       SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public.orders_dispatch              SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public.payment_reminder_logs        SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public.whatsapp_message_logs        SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = 'dce44caf-c94b-495c-908b-aa32635671fa';
UPDATE public._archived_label_design_costs SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = 'dce44caf-c94b-495c-908b-aa32635671fa';
DELETE FROM public.customers WHERE id = 'dce44caf-c94b-495c-908b-aa32635671fa';

UPDATE public.sales_transactions           SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public.label_purchases              SET client_id   = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE client_id   = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public.invoices                     SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public.transport_expenses           SET client_id   = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE client_id   = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public.client_commissions           SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public.client_followup_notes        SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public.factory_payables             SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public.orders                       SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public.orders_dispatch              SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public.payment_reminder_logs        SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public.whatsapp_message_logs        SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
UPDATE public._archived_label_design_costs SET customer_id = '6ce0fbbb-bda1-415b-81eb-9c31ee9be062' WHERE customer_id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';
DELETE FROM public.customers WHERE id = '48dc96fb-1ba3-4235-89fe-ab7239d31194';

-- ============================================================
-- Tonique Vijayawada  (PRIMARY = 1b65d5d1-0ffe-4669-9204-4f008134bd7e)
-- ============================================================
UPDATE public.label_purchases              SET client_id   = '1b65d5d1-0ffe-4669-9204-4f008134bd7e' WHERE client_id   = 'e1458e1b-14b3-4532-b267-a273d8042ff1';
DELETE FROM public.customers WHERE id = 'e1458e1b-14b3-4532-b267-a273d8042ff1';

-- ============================================================
-- Aaha Khajaguda  (PRIMARY = e26e6068 — delete empty duplicate)
-- ============================================================
DELETE FROM public.customers WHERE id = 'da601691-0eea-4817-a2e3-0aca3d65611d';
