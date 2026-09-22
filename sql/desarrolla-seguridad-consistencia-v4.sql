-- Desarrolla SST · consistencia de evaluación, pagos y permisos
-- 22-09-2026

create or replace function private.desarrolla_ruta_cumple(p_integrante_id bigint,p_diagnostico text)
returns boolean
language sql
stable
set search_path=''
as $$
 select exists(
   select 1 from public.desarrolla_resultados r
   where r.integrante_id=p_integrante_id and r.diagnostico=p_diagnostico
 ) and (
   select count(distinct p.etapa)=4
   from public.desarrolla_progreso p
   where p.integrante_id=p_integrante_id and p.diagnostico=p_diagnostico
     and (
       p.etapa in ('guia','practica','plan')
       or (
         p.etapa='evaluacion'
         and coalesce((p.metadata->>'score')::int,0)>=80
         and coalesce((p.metadata->>'aprobada')::boolean,false)
         and (
           coalesce((p.metadata->>'criticos_aprobados')::boolean,false)
           or coalesce(p.metadata->>'version','') in ('1','2')
         )
       )
     )
 );
$$;

create or replace function public.desarrolla_reportar_pago(p_token uuid,p_diagnostico text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_s record;v_i record;v_estado text;v_competencia text;
begin
 select * into v_s from private.participa_sesion_actual(p_token);
 if v_s.integrante_id is null then
   return jsonb_build_object('ok',false,'message','Sesión vencida. Ingresa nuevamente.');
 end if;

 v_competencia:=case p_diagnostico
   when 'negociacion' then 'Resolución de conflictos y negociación en SST'
   when 'comunicacion_asertiva' then 'Comunicación asertiva'
   when 'liderazgo_preventivo' then 'Liderazgo preventivo'
   when 'influencia_estrategica' then 'Influencia estratégica'
   when 'pensamiento_critico' then 'Pensamiento crítico'
   when 'gestion_emocional' then 'Gestión emocional'
   when 'finanzas_sst' then 'Finanzas y Valor Preventivo en SST'
   else null end;
 if v_competencia is null then
   return jsonb_build_object('ok',false,'message','Competencia no válida.');
 end if;

 if not private.desarrolla_ruta_cumple(v_s.integrante_id,p_diagnostico)
    and not exists(
      select 1 from private.desarrolla_insignias_override o
      where o.integrante_id=v_s.integrante_id and o.diagnostico=p_diagnostico and o.activa
    ) then
   return jsonb_build_object('ok',false,'message','Primero debes completar la ruta de la competencia.');
 end if;

 insert into private.desarrolla_pagos_certificado(integrante_id,diagnostico,estado,reportado_at,actualizado_at)
 values(v_s.integrante_id,p_diagnostico,'pendiente',now(),now())
 on conflict(integrante_id,diagnostico) do update
 set reportado_at=coalesce(private.desarrolla_pagos_certificado.reportado_at,now()),
     actualizado_at=now(),
     estado=case when private.desarrolla_pagos_certificado.estado='validado' then 'validado' else 'pendiente' end
 returning estado into v_estado;

 select nombres,apellidos,coalesce(nullif(documento,''),nullif(cedula,'')) documento
 into v_i from public.integrantes where id=v_s.integrante_id;

 return jsonb_build_object(
   'ok',true,'estado',v_estado,'monto',5,'moneda','USD',
   'nombre',btrim(concat_ws(' ',v_i.nombres,v_i.apellidos)),
   'documento',v_i.documento,'competencia',v_competencia
 );
end;
$$;

-- Las funciones administrativas conservan la validación interna is_app_admin().
-- Se elimina además la superficie anónima que no necesitan.
revoke execute on function public.desarrolla_admin_anular_certificado(text,text) from anon,public;
revoke execute on function public.desarrolla_admin_certificados_estado() from anon,public;
revoke execute on function private.desarrolla_ruta_cumple(bigint,text) from anon,authenticated,public;

grant execute on function public.desarrolla_reportar_pago(uuid,text) to anon;

-- Alinear las lecturas administrativas con el criterio de la plataforma:
-- 80 % y aprobación explícita de decisiones críticas.
create or replace function public.desarrolla_evaluacion_aprobada(p_metadata jsonb)
returns boolean
language sql
immutable
set search_path=''
as $$
 select coalesce((p_metadata->>'score')::int,0)>=80
    and coalesce((p_metadata->>'aprobada')::boolean,false)
    and (
      coalesce((p_metadata->>'criticos_aprobados')::boolean,false)
      or coalesce(p_metadata->>'version','') in ('1','2')
    );
$$;
revoke execute on function public.desarrolla_evaluacion_aprobada(jsonb) from anon,authenticated,public;

do $$
declare src text;
begin
 select pg_get_functiondef(p.oid) into src
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='desarrolla_admin_panel' limit 1;
 src:=replace(src,$q$coalesce((metadata->>'score')::int,0)>=75$q$,$q$public.desarrolla_evaluacion_aprobada(metadata)$q$);
 execute src;

 select pg_get_functiondef(p.oid) into src
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='desarrolla_registrar_etapa' limit 1;
 src:=replace(src,$q$case when p_etapa='evaluacion' then v_score>=75 else true end$q$,$q$case when p_etapa='evaluacion' then public.desarrolla_evaluacion_aprobada(v_meta) else true end$q$);
 src:=replace(src,$q$p_etapa='evaluacion' and v_score<75$q$,$q$p_etapa='evaluacion' and not public.desarrolla_evaluacion_aprobada(v_meta)$q$);
 src:=replace(src,$q$Se requiere 75 % para completar la ruta.$q$,$q$Se requiere 80 % y aprobar las decisiones críticas para completar la ruta.$q$);
 execute src;

 select pg_get_functiondef(p.oid) into src
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='desarrolla_generar_certificado' limit 1;
 src:=replace(src,$q$aprueba Demuestra con al menos 75 %.$q$,$q$aprueba Demuestra con al menos 80 % y todas las decisiones críticas.$q$);
 execute src;
end $$;
