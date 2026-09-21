-- Desarrolla SST · Competencia 07: Finanzas y Valor Preventivo en SST
-- Amplía diagnóstico/progreso/certificados y siembra los ocho casos base de role play.

alter table public.desarrolla_progreso drop constraint if exists desarrolla_progreso_diagnostico_check;
alter table public.desarrolla_progreso add constraint desarrolla_progreso_diagnostico_check
check (diagnostico in ('negociacion','comunicacion_asertiva','liderazgo_preventivo','influencia_estrategica','pensamiento_critico','gestion_emocional','finanzas_sst'));

alter table private.desarrolla_certificados drop constraint if exists desarrolla_certificados_diagnostico_check;
alter table private.desarrolla_certificados add constraint desarrolla_certificados_diagnostico_check
check (diagnostico in ('negociacion','comunicacion_asertiva','liderazgo_preventivo','influencia_estrategica','pensamiento_critico','gestion_emocional','finanzas_sst'));

alter table private.desarrolla_insignias_override drop constraint if exists desarrolla_insignias_override_diagnostico_check;
alter table private.desarrolla_insignias_override add constraint desarrolla_insignias_override_diagnostico_check
check (diagnostico in ('negociacion','comunicacion_asertiva','liderazgo_preventivo','influencia_estrategica','pensamiento_critico','gestion_emocional','finanzas_sst'));

alter table private.desarrolla_pagos_certificado drop constraint if exists desarrolla_pagos_certificado_diagnostico_check;
alter table private.desarrolla_pagos_certificado add constraint desarrolla_pagos_certificado_diagnostico_check
check (diagnostico in ('negociacion','comunicacion_asertiva','liderazgo_preventivo','influencia_estrategica','pensamiento_critico','gestion_emocional','finanzas_sst'));

alter table private.desarrolla_roleplay_cases drop constraint if exists desarrolla_roleplay_cases_competency_check;
alter table private.desarrolla_roleplay_cases add constraint desarrolla_roleplay_cases_competency_check
check (competency in ('negotiation','communication','leadership','influence','critical','emotional','finance'));

do $$
declare src text;
begin
 select pg_get_functiondef(p.oid) into src from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='desarrolla_completar_diagnostico' limit 1;
 if position('finanzas_sst' in src)=0 then
   src:=replace(src,'when ''gestion_emocional'' then ''Gestión emocional y conversaciones difíciles en SST''','when ''gestion_emocional'' then ''Gestión emocional y conversaciones difíciles en SST''
    when ''finanzas_sst'' then ''Finanzas y Valor Preventivo en SST'''); execute src;
 end if;

 select pg_get_functiondef(p.oid) into src from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='desarrolla_registrar_etapa' limit 1;
 if position('finanzas_sst' in src)=0 then
   src:=replace(src,'''pensamiento_critico'',''gestion_emocional'')','''pensamiento_critico'',''gestion_emocional'',''finanzas_sst'')');
   src:=replace(src,'when ''gestion_emocional'' then ''Gestión emocional y conversaciones difíciles en SST''','when ''gestion_emocional'' then ''Gestión emocional y conversaciones difíciles en SST''
        when ''finanzas_sst'' then ''Finanzas y Valor Preventivo en SST'''); execute src;
 end if;

 select pg_get_functiondef(p.oid) into src from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='desarrolla_generar_certificado' limit 1;
 if position('finanzas_sst' in src)=0 then src:=replace(src,'when ''gestion_emocional'' then ''Gestión emocional'' else null end','when ''gestion_emocional'' then ''Gestión emocional'' when ''finanzas_sst'' then ''Finanzas y Valor Preventivo en SST'' else null end'); execute src; end if;

 select pg_get_functiondef(p.oid) into src from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='desarrolla_verificar_certificado' limit 1;
 if position('finanzas_sst' in src)=0 then src:=replace(src,'when ''gestion_emocional'' then ''Gestión emocional'' else v.diagnostico end','when ''gestion_emocional'' then ''Gestión emocional'' when ''finanzas_sst'' then ''Finanzas y Valor Preventivo en SST'' else v.diagnostico end'); execute src; end if;

 select pg_get_functiondef(p.oid) into src from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='desarrolla_rutas_certificables' limit 1;
 if position('finanzas_sst' in src)=0 then src:=replace(src,'when ''gestion_emocional'' then 6 end','when ''gestion_emocional'' then 6 when ''finanzas_sst'' then 7 end'); execute src; end if;

 select pg_get_functiondef(p.oid) into src from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='desarrolla_admin_panel' limit 1;
 src:=replace(src,'having count(*)=6 and bool_and(ruta_completa)','having count(*)=7 and bool_and(ruta_completa)'); execute src;
end $$;

insert into private.desarrolla_roleplay_cases
(competency,legacy_key,icon,actor_name,case_name,context,opening,goal,limit_text,difficulty,critical_rules,guided_choices,ai_only,active,sort_order,source)
values
('finance',$q$cfo$q$,$q$💼$q$,$q$Director Financiero$q$,$q$Sistema de extracción de USD 85.000$q$,$q$Una exposición relevante requiere un sistema de extracción localizada. Finanzas cuestiona la inversión inicial.$q$,$q$Entiendo el problema técnico, pero está pidiendo USD 85.000. ¿Qué obtiene la empresa por ese dinero?$q$,$q$Construir una propuesta de inversión comprensible y trazable.$q$,$q$No manipular cifras ni aceptar mantener una exposición inaceptable por un ROI desfavorable.$q$,3,$q$$q$,$q$[["Explicar riesgo, CAPEX, OPEX, alternativas, beneficio estimado, supuestos y decisión requerida.",2,"Construyes un business case verificable."],["Decir que la seguridad no tiene precio y que Finanzas debe aprobarlo.",0,"Defiendes el propósito, pero no respondes la decisión económica."],["Inflar el costo de un posible accidente para que el ROI sea positivo.",-1,"Manipulas la evidencia económica."]]$q$::jsonb,false,true,1,'builtin'),
('finance',$q$operaciones$q$,$q$🏭$q$,$q$Gerente de Operaciones$q$,$q$Control con parada de tres días$q$,$q$La alternativa técnicamente preferida requiere detener parcialmente una línea durante tres días.$q$,$q$Su solución reduce el riesgo, pero me obliga a parar la línea tres días.$q$,$q$Comparar escenarios de implementación sin deteriorar el control.$q$,$q$No ocultar impacto operacional ni sacrificar un control crítico.$q$,3,$q$$q$,$q$[["Comparar parada total, implementación por etapas y ventana de mantenimiento con costo y riesgo residual.",2,"Integras prevención y continuidad operacional."],["Responder que producción nunca debe importar frente a seguridad.",0,"El límite preventivo sigue firme, pero no optimizas implementación."],["Ocultar el tiempo real de parada para lograr aprobación.",-1,"La propuesta deja de ser íntegra."]]$q$::jsonb,false,true,2,'builtin'),
('finance',$q$finanzas$q$,$q$📊$q$,$q$Gerencia de Finanzas$q$,$q$Recorte de 20 % al presupuesto SST$q$,$q$Finanzas exige reducir el presupuesto anual de SST en veinte por ciento.$q$,$q$Su presupuesto debe bajar 20 %. Dígame qué elimina.$q$,$q$Repriorizar presupuesto manteniendo obligaciones y controles críticos.$q$,$q$No recortar actividades esenciales solo para cumplir una cifra.$q$,4,$q$$q$,$q$[["Separar obligaciones y controles críticos de partidas reprogramables, eficiencias y proyectos escalonables.",2,"Priorizas con criterio preventivo y económico."],["Negarse a revisar cualquier partida porque seguridad no se negocia.",0,"Proteges el propósito, pero no gestionas recursos."],["Eliminar primero capacitación y mantenimiento porque no generan ingreso.",-1,"Puede debilitar controles esenciales sin análisis."]]$q$::jsonb,false,true,3,'builtin'),
('finance',$q$compras$q$,$q$🛒$q$,$q$Compras$q$,$q$Opción económica vs costo total$q$,$q$Dos controles cumplen el requisito inicial; uno cuesta USD 12.000 menos, pero tiene mayor mantenimiento y menor vida útil.$q$,$q$El A cumple y cuesta 12.000 menos. ¿Por qué quiere el B?$q$,$q$Comparar alternativas por costo total y desempeño preventivo.$q$,$q$No ocultar costos o limitaciones relevantes.$q$,3,$q$$q$,$q$[["Comparar eficacia, CAPEX, OPEX, vida útil, mantenimiento, productividad, TCO y riesgo residual.",2,"La comparación deja de ser solo precio."],["Decir que B es de mejor marca.",0,"La preferencia no demuestra valor."],["Ocultar los costos de mantenimiento de B para justificarlo.",-1,"Manipulas información material."]]$q$::jsonb,false,true,4,'builtin'),
('finance',$q$directiva$q$,$q$🏢$q$,$q$Junta Directiva$q$,$q$Tres inversiones compiten por USD 100.000$q$,$q$Ventilación, automatización y protección colectiva compiten por un presupuesto insuficiente para ejecutar todo este trimestre.$q$,$q$Solo hay USD 100.000. ¿Cuál va primero y por qué?$q$,$q$Priorizar inversiones con criterios preventivos, económicos y de urgencia.$q$,$q$No usar ROI como único criterio ante obligaciones o riesgos inaceptables.$q$,4,$q$$q$,$q$[["Comparar daño, exposición, obligación, eficacia, urgencia, costo, incertidumbre y riesgo residual.",2,"Priorizas con criterios múltiples."],["Elegir automáticamente el proyecto con mayor ROI.",-1,"ROI no reemplaza el criterio preventivo."],["Repartir el presupuesto por igual entre los tres.",0,"Es simple, pero puede impedir controles eficaces."]]$q$::jsonb,false,true,5,'builtin'),
('finance',$q$cfo_roi$q$,$q$💵$q$,$q$Director Financiero$q$,$q$Proyecto con ROI negativo$q$,$q$Una medida necesaria para controlar una exposición tiene retorno financiero estimado negativo.$q$,$q$Su proyecto tiene ROI negativo. Entonces no lo hacemos.$q$,$q$Defender una decisión preventiva aun cuando el retorno financiero no sea positivo.$q$,$q$No presentar rentabilidad como requisito para cumplir un control necesario.$q$,4,$q$$q$,$q$[["Explicar que el ROI informa la implementación, pero no elimina la necesidad de controlar; optimizar alternativas y costos.",2,"Distingues obligación preventiva de rentabilidad."],["Aceptar mantener la condición hasta que el ROI mejore.",-1,"Subordinas un límite preventivo a la rentabilidad."],["Prometer que el ROI será positivo aunque no exista evidencia.",-1,"Inventas retorno para conseguir aprobación."]]$q$::jsonb,false,true,6,'builtin'),
('finance',$q$incidente$q$,$q$🧾$q$,$q$Director de Planta$q$,$q$Costo real de un incidente$q$,$q$Después de un incidente la dirección quiere conocer el impacto económico total.$q$,$q$¿Cuánto nos costó realmente este incidente?$q$,$q$Construir una estimación económica transparente del incidente.$q$,$q$No presentar estimaciones o escenarios como costos confirmados.$q$,3,$q$$q$,$q$[["Separar costos confirmados, indirectos estimados, interrupción y datos aún pendientes.",2,"Mantienes trazabilidad y honestidad."],["Dar inmediatamente un valor total aproximado sin explicar supuestos.",0,"Respondes rápido, pero mezclas datos y estimaciones."],["Incluir cualquier costo futuro posible como pérdida ya ocurrida.",-1,"Inflas el impacto."]]$q$::jsonb,false,true,7,'builtin'),
('finance',$q$presupuesto$q$,$q$📅$q$,$q$CFO$q$,$q$Presupuesto anual y baja ejecución$q$,$q$El año anterior SST pidió USD 250.000 y ejecutó USD 190.000; ahora solicita USD 300.000.$q$,$q$El año pasado no ejecutaron todo. ¿Por qué debería aprobar USD 300.000 este año?$q$,$q$Justificar un presupuesto anual a partir de ejecución, variaciones y necesidades futuras.$q$,$q$No ocultar subejecución ni inflar partidas para crear margen.$q$,3,$q$$q$,$q$[["Explicar variación, partidas diferidas, alcance ejecutado, forecast y nuevas necesidades con hitos.",2,"La nueva solicitud queda trazable."],["Decir que el presupuesto debe crecer porque cada año hay más riesgos.",0,"No demuestra necesidad ni capacidad de ejecución."],["Ocultar las partidas no ejecutadas del año pasado.",-1,"Debilitas la integridad del presupuesto."]]$q$::jsonb,false,true,8,'builtin')
on conflict (competency,legacy_key) where legacy_key is not null do update set
 icon=excluded.icon,actor_name=excluded.actor_name,case_name=excluded.case_name,context=excluded.context,opening=excluded.opening,
 goal=excluded.goal,limit_text=excluded.limit_text,difficulty=excluded.difficulty,guided_choices=excluded.guided_choices,
 ai_only=excluded.ai_only,active=excluded.active,sort_order=excluded.sort_order,updated_at=now();
