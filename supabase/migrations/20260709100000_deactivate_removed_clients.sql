-- Deactivate clients no longer in use
-- Keeping: "House party" Sanikpuri, "jagan Pan House" Bhoodan Pochampally

UPDATE public.customers SET is_active = false
WHERE (client_name = 'House Party' AND branch = '');

UPDATE public.customers SET is_active = false
WHERE client_name = 'Iguru';

UPDATE public.customers SET is_active = false
WHERE (client_name = 'Jagan pan house' AND branch = '');

UPDATE public.customers SET is_active = false
WHERE client_name = 'Jubile Festa';

UPDATE public.customers SET is_active = false
WHERE client_name IN ('Mid land', 'Mid Land');
