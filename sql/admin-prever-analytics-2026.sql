-- Desarrolla SST · analítica comunitaria PREVER para Administración
-- 22-09-2026
-- Aplicado en producción. No expone respuestas individuales.

create or replace function public.desarrolla_admin_prever_resumen()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_data jsonb;
begin
  if not public.is_app_admin() then
    raise exception 'Acceso no autorizado';
  end if;

  with base as (
    select p.integrante_id,p.metadata,p.actualizada_at
    from public.desarrolla_progreso p
    where p.diagnostico='pensamiento_critico'
      and p.etapa='prebunking'
      and coalesce((p.metadata->>'completado')::boolean,false)
  ),
  dominios as (
    select
      d->>'key' key,
      round(avg(coalesce((d->>'score')::numeric,0)),1) promedio,
      count(*) participantes,
      sum(coalesce((d->>'correct')::int,0)) correctos,
      sum(coalesce((d->>'total')::int,0)) casos
    from base b
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(b.metadata->'perfil')='array'
           then b.metadata->'perfil' else '[]'::jsonb end
    ) d
    where coalesce(d->>'key','')<>''
    group by d->>'key'
  ),
  senales as (
    select
      s->>'key' key,
      round(avg(coalesce((s->>'score')::numeric,0)),1) promedio,
      count(*) participantes,
      count(*) filter(where coalesce((s->>'score')::int,0)>=100) aciertos
    from base b
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(b.metadata->'senales')='array'
           then b.metadata->'senales' else '[]'::jsonb end
    ) s
    where coalesce(s->>'key','')<>''
    group by s->>'key'
  ),
  tendencia as (
    select
      date_trunc('week',actualizada_at)::date semana,
      count(*) participantes,
      round(avg(coalesce((metadata->>'score')::numeric,0)),1) promedio
    from base
    where actualizada_at>=current_date-interval '84 days'
    group by date_trunc('week',actualizada_at)::date
  )
  select jsonb_build_object(
    'ok',true,
    'participantes',(select count(*) from base),
    'promedio_global',coalesce((select round(avg(coalesce((metadata->>'score')::numeric,0)),1) from base),0),
    'casos_promedio',coalesce((select round(avg(coalesce((metadata->>'casos')::numeric,0)),1) from base),0),
    'actualizado_at',(select max(actualizada_at) from base),
    'dominios',coalesce((select jsonb_agg(jsonb_build_object(
      'key',key,'promedio',promedio,'participantes',participantes,'correctos',correctos,'casos',casos
    ) order by promedio asc,key) from dominios),'[]'::jsonb),
    'senales',coalesce((select jsonb_agg(jsonb_build_object(
      'key',key,'promedio',promedio,'participantes',participantes,'aciertos',aciertos
    ) order by promedio asc,key) from senales),'[]'::jsonb),
    'tendencia',coalesce((select jsonb_agg(jsonb_build_object(
      'semana',semana,'participantes',participantes,'promedio',promedio
    ) order by semana) from tendencia),'[]'::jsonb)
  ) into v_data;

  return v_data;
end;
$$;

revoke execute on function public.desarrolla_admin_prever_resumen() from public,anon;
grant execute on function public.desarrolla_admin_prever_resumen() to authenticated;

do $$
declare src text;
begin
  select pg_get_functiondef(p.oid) into src
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='desarrolla_admin_panel' limit 1;

  if position($q$bool_or(etapa='prebunking')$q$ in src)=0 then
    src:=replace(src,
      $q$bool_or(etapa='guia') guia,$q$,
      $q$bool_or(etapa='guia') guia,
   bool_or(etapa='prebunking') prebunking,$q$);
    src:=replace(src,
      $q$coalesce(a.guia,false) guia,coalesce(a.practica,false) practica,coalesce(a.plan,false) plan,$q$,
      $q$coalesce(a.guia,false) guia,coalesce(a.prebunking,false) prebunking,coalesce(a.practica,false) practica,coalesce(a.plan,false) plan,$q$);
    src:=replace(src,
      $q$'guia',coalesce(rt.guia,false),'practica',coalesce(rt.practica,false),'plan',coalesce(rt.plan,false),$q$,
      $q$'guia',coalesce(rt.guia,false),'prebunking',coalesce(rt.prebunking,false),'practica',coalesce(rt.practica,false),'plan',coalesce(rt.plan,false),$q$);
    execute src;
  end if;
end $$;
