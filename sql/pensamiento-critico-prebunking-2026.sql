-- Desarrolla SST · PREVER como evidencia obligatoria de Pensamiento Crítico
-- 22-09-2026
-- Aplicado en producción antes del lanzamiento público del 01-10-2026.

alter table public.desarrolla_progreso
  drop constraint if exists desarrolla_progreso_etapa_check;

alter table public.desarrolla_progreso
  add constraint desarrolla_progreso_etapa_check
  check (etapa in ('guia','prebunking','practica','plan','evaluacion'));

create or replace function private.desarrolla_ruta_cumple(p_integrante_id bigint,p_diagnostico text)
returns boolean
language sql
stable
set search_path=''
as $$
 select exists(
   select 1
   from public.desarrolla_resultados r
   where r.integrante_id=p_integrante_id
     and r.diagnostico=p_diagnostico
 ) and (
   select count(distinct p.etapa)
   from public.desarrolla_progreso p
   where p.integrante_id=p_integrante_id
     and p.diagnostico=p_diagnostico
     and (
       p.etapa in ('guia','practica','plan')
       or (
         p_diagnostico='pensamiento_critico'
         and p.etapa='prebunking'
         and coalesce((p.metadata->>'completado')::boolean,false)
       )
       or (
         p.etapa='evaluacion'
         and public.desarrolla_evaluacion_aprobada(p.metadata)
       )
     )
 ) = case when p_diagnostico='pensamiento_critico' then 5 else 4 end;
$$;

create or replace function public.desarrolla_registrar_etapa(
  p_token uuid,
  p_diagnostico text,
  p_etapa text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_s record;
  v_meta jsonb;
  v_score int;
  v_resultado uuid;
  v_evento uuid;
  v_xp int:=0;
  v_titulo text;
begin
  select * into v_s from private.participa_sesion_actual(p_token);
  if v_s.integrante_id is null then
    return jsonb_build_object('ok',false,'message','Sesión vencida. Ingresa nuevamente.');
  end if;

  if p_diagnostico not in (
      'negociacion','comunicacion_asertiva','liderazgo_preventivo',
      'influencia_estrategica','pensamiento_critico','gestion_emocional','finanzas_sst'
    )
    or p_etapa not in ('guia','prebunking','practica','plan','evaluacion') then
    return jsonb_build_object('ok',false,'message','Etapa no válida.');
  end if;

  if p_etapa='prebunking' and p_diagnostico<>'pensamiento_critico' then
    return jsonb_build_object('ok',false,'message','Esta evidencia solo aplica a Pensamiento crítico.');
  end if;

  v_meta:=case
    when jsonb_typeof(coalesce(p_metadata,'{}'::jsonb))='object'
      then coalesce(p_metadata,'{}'::jsonb)
    else '{}'::jsonb
  end;

  if pg_column_size(v_meta)>8192 then
    return jsonb_build_object('ok',false,'message','La evidencia supera el tamaño permitido.');
  end if;

  if p_etapa in ('evaluacion','prebunking') then
    begin
      v_score:=coalesce((v_meta->>'score')::int,0);
    exception when others then
      v_score:=0;
    end;
    if v_score<0 or v_score>100 then
      return jsonb_build_object('ok',false,'message','Puntaje inválido.');
    end if;
  end if;

  if p_etapa='prebunking'
     and not coalesce((v_meta->>'completado')::boolean,false) then
    return jsonb_build_object('ok',false,'message','Completa el Radar PREVER antes de registrar esta evidencia.');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('desarrolla:'||v_s.integrante_id::text||':'||p_diagnostico,0)
  );

  insert into public.desarrolla_progreso(integrante_id,diagnostico,etapa,metadata)
  values(v_s.integrante_id,p_diagnostico,p_etapa,v_meta)
  on conflict(integrante_id,diagnostico,etapa)
  do update set metadata=excluded.metadata,actualizada_at=now();

  if private.desarrolla_ruta_cumple(v_s.integrante_id,p_diagnostico) then
    select id into v_resultado
    from public.desarrolla_resultados
    where integrante_id=v_s.integrante_id and diagnostico=p_diagnostico;

    if v_resultado is not null and not exists(
      select 1 from public.desarrolla_puntos_otorgados where resultado_id=v_resultado
    ) then
      v_titulo:=case p_diagnostico
        when 'negociacion' then 'Resolución de conflictos y negociación en SST'
        when 'comunicacion_asertiva' then 'Comunicación asertiva en SST'
        when 'liderazgo_preventivo' then 'Liderazgo preventivo en SST'
        when 'influencia_estrategica' then 'Influencia estratégica para la SST'
        when 'pensamiento_critico' then 'Pensamiento crítico, información y toma de decisiones en SST'
        when 'gestion_emocional' then 'Gestión emocional y conversaciones difíciles en SST'
        when 'finanzas_sst' then 'Finanzas y Valor Preventivo en SST'
      end;

      insert into public.puntos_eventos(
        integrante_id,tipo,puntos,motivo,referencia,metadata
      )
      values(
        v_s.integrante_id,'actividad',100,'Ruta completada: '||v_titulo,
        'desarrolla:'||p_diagnostico||':'||v_s.integrante_id::text,
        jsonb_build_object(
          'origen','desarrolla','subtipo','ruta_completa',
          'diagnostico',p_diagnostico,'independiente_pago',true
        )
      )
      returning id into v_evento;

      insert into public.desarrolla_puntos_otorgados(resultado_id,puntos_evento_id)
      values(v_resultado,v_evento);
      v_xp:=100;
    end if;
  end if;

  return jsonb_build_object(
    'ok',true,
    'aprobada',case
      when p_etapa='evaluacion' then public.desarrolla_evaluacion_aprobada(v_meta)
      else true
    end,
    'ruta_completa',private.desarrolla_ruta_cumple(v_s.integrante_id,p_diagnostico),
    'puntos_otorgados',v_xp,
    'message',case
      when v_xp=100 then '¡Ruta completada! Sumaste 100 XP al ranking. El certificado es opcional y se gestiona por separado.'
      when p_etapa='prebunking' then 'Radar PREVER registrado como evidencia de aprendizaje.'
      when p_etapa='evaluacion' and not public.desarrolla_evaluacion_aprobada(v_meta)
        then 'Evaluación registrada. Se requiere 80 % y aprobar las decisiones críticas para completar la ruta.'
      else 'Progreso sincronizado.'
    end
  );
end;
$$;

revoke execute on function private.desarrolla_ruta_cumple(bigint,text)
from anon,authenticated,public;

-- Alinear el nombre visible en certificado, verificación y reporte de pago.
do $$
declare src text;
begin
  select pg_get_functiondef(p.oid) into src
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='desarrolla_generar_certificado' limit 1;
  src:=replace(src,
    $q$when 'pensamiento_critico' then 'Pensamiento crítico'$q$,
    $q$when 'pensamiento_critico' then 'Pensamiento crítico, información y toma de decisiones'$q$);
  execute src;

  select pg_get_functiondef(p.oid) into src
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='desarrolla_verificar_certificado' limit 1;
  src:=replace(src,
    $q$when 'pensamiento_critico' then 'Pensamiento crítico'$q$,
    $q$when 'pensamiento_critico' then 'Pensamiento crítico, información y toma de decisiones'$q$);
  execute src;

  select pg_get_functiondef(p.oid) into src
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='desarrolla_reportar_pago' limit 1;
  src:=replace(src,
    $q$when 'pensamiento_critico' then 'Pensamiento crítico'$q$,
    $q$when 'pensamiento_critico' then 'Pensamiento crítico, información y toma de decisiones'$q$);
  execute src;
end $$;
