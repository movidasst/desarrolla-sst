-- Apertura pública de Desarrolla SST · Octubre Fest 2026
create or replace function public.desarrolla_disponibilidad()
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select jsonb_build_object(
    'abierto', now() >= timestamptz '2026-10-01 00:00:00-04',
    'server_now', now(),
    'opens_at', timestamptz '2026-10-01 00:00:00-04',
    'timezone', 'America/Caracas',
    'label', '1 de octubre de 2026'
  );
$$;

grant execute on function public.desarrolla_disponibilidad() to anon, authenticated;
