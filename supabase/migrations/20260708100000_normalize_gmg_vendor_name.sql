-- Normalize all "GMG" vendor entries to "GMG labels" in label_purchases and label_payments
UPDATE public.label_purchases SET vendor_id = 'GMG labels' WHERE vendor_id = 'GMG';
UPDATE public.label_payments  SET vendor_id = 'GMG labels' WHERE vendor_id = 'GMG';
