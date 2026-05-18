ALTER TABLE public.hospitals ALTER COLUMN country SET DEFAULT 'Kenya';
UPDATE public.hospitals SET country = 'Kenya' WHERE country = 'Nigeria';