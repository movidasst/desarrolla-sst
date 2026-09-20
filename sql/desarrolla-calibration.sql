-- Desarrolla SST · persistencia de calibración IA
create table if not exists private.desarrolla_calibration_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  admin_user_id uuid not null,
  bank_version text not null,
  model text,
  repetitions integer not null default 1 check (repetitions between 1 and 3),
  total_tests integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  results jsonb not null default '[]'::jsonb,
  status text not null default 'completed' check (status in ('completed','partial','failed')),
  created_at timestamptz not null default now()
);

create or replace function public.desarrolla_calibration_guardar(
  p_bank_version text,
  p_model text,
  p_repetitions integer,
  p_summary jsonb,
  p_results jsonb,
  p_status text default 'completed'
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_id uuid;
begin
  if not public.is_app_admin() then raise exception 'Acceso no autorizado'; end if;
  if coalesce(p_repetitions,0) not between 1 and 3 then raise exception 'Repeticiones no válidas'; end if;
  if p_status not in ('completed','partial','failed') then raise exception 'Estado no válido'; end if;
  if jsonb_typeof(coalesce(p_summary,'{}'::jsonb)) <> 'object' then raise exception 'Resumen inválido'; end if;
  if jsonb_typeof(coalesce(p_results,'[]'::jsonb)) <> 'array' then raise exception 'Resultados inválidos'; end if;
  if pg_column_size(coalesce(p_results,'[]'::jsonb)) > 2000000 then raise exception 'Resultados demasiado grandes'; end if;
  insert into private.desarrolla_calibration_runs(admin_user_id,bank_version,model,repetitions,total_tests,summary,results,status)
  values(auth.uid(),left(coalesce(p_bank_version,'sin-version'),80),left(coalesce(p_model,''),120),p_repetitions,jsonb_array_length(coalesce(p_results,'[]'::jsonb)),coalesce(p_summary,'{}'::jsonb),coalesce(p_results,'[]'::jsonb),p_status)
  returning id into v_id;
  return jsonb_build_object('ok',true,'id',v_id);
end $$;

revoke all on function public.desarrolla_calibration_guardar(text,text,integer,jsonb,jsonb,text) from public, anon;
grant execute on function public.desarrolla_calibration_guardar(text,text,integer,jsonb,jsonb,text) to authenticated;

create or replace function public.desarrolla_calibration_historial(p_limit integer default 10)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  if not public.is_app_admin() then raise exception 'Acceso no autorizado'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',r.id,'bank_version',r.bank_version,'model',r.model,'repetitions',r.repetitions,
      'total_tests',r.total_tests,'summary',r.summary,'status',r.status,'created_at',r.created_at
    ) order by r.created_at desc)
    from (
      select * from private.desarrolla_calibration_runs
      order by created_at desc
      limit greatest(1,least(coalesce(p_limit,10),50))
    ) r
  ),'[]'::jsonb);
end $$;

revoke all on function public.desarrolla_calibration_historial(integer) from public, anon;
grant execute on function public.desarrolla_calibration_historial(integer) to authenticated;
