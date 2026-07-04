-- Remove misrouted Soul of South Financial District adjustment.
-- Row cac09272 (Mar 31 2026, +1280 qty) was assigned to the Financial District
-- branch UUID (c66dbbc1) instead of Film nagar (1794596c).
-- Soul of South total labels = 21183 (Film nagar only); this row makes it 22463.
DELETE FROM public.label_purchases
WHERE id = 'cac09272-88c3-479d-9d9e-5fb93c7c767a';
