-- Desarrolla SST · catálogo administrable de Role Play
-- Producción: tabla privada + RPC de participante y administración + 36 casos base.

create table if not exists private.desarrolla_roleplay_cases (
 id uuid primary key default extensions.gen_random_uuid(),
 legacy_key text,
 competency text not null check (competency in ('negotiation','communication','leadership','influence','critical','emotional','finance')),
 icon text not null default '🎭',
 actor_name text not null,
 case_name text not null,
 context text not null,
 opening text not null,
 goal text not null default '',
 limit_text text not null default '',
 difficulty integer not null default 2 check (difficulty between 1 and 5),
 critical_rules text not null default '',
 guided_choices jsonb not null default '[]'::jsonb,
 ai_only boolean not null default false,
 active boolean not null default true,
 sort_order integer not null default 0,
 source text not null default 'custom' check (source in ('builtin','custom')),
 created_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint roleplay_guided_choices_array check (jsonb_typeof(guided_choices)='array')
);
alter table private.desarrolla_roleplay_cases enable row level security;
create unique index if not exists desarrolla_roleplay_cases_legacy_uq on private.desarrolla_roleplay_cases(competency,legacy_key) where legacy_key is not null;
create index if not exists desarrolla_roleplay_cases_active_idx on private.desarrolla_roleplay_cases(competency,active,sort_order);
revoke all on private.desarrolla_roleplay_cases from public,anon,authenticated;

create or replace function public.desarrolla_roleplay_cases(p_token uuid,p_competency text)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_s record;
begin
 select * into v_s from private.participa_sesion_actual(p_token);
 if v_s.integrante_id is null then return jsonb_build_object('ok',false,'message','Tu sesión venció. Ingresa nuevamente.'); end if;
 if p_competency not in ('negotiation','communication','leadership','influence','critical','emotional','finance') then return jsonb_build_object('ok',false,'message','Competencia no válida.'); end if;
 return jsonb_build_object('ok',true,'cases',coalesce((
  select jsonb_agg(jsonb_build_object(
   'id',c.id,'legacy_key',c.legacy_key,'competency',c.competency,'icon',c.icon,'actor_name',c.actor_name,'case_name',c.case_name,
   'context',c.context,'opening',c.opening,'goal',c.goal,'limit_text',c.limit_text,'difficulty',c.difficulty,'critical_rules',c.critical_rules,
   'guided_choices',c.guided_choices,'ai_only',c.ai_only,'sort_order',c.sort_order,'source',c.source
  ) order by c.sort_order,c.created_at)
  from private.desarrolla_roleplay_cases c where c.active and c.competency=p_competency
 ),'[]'::jsonb));
end $$;
revoke all on function public.desarrolla_roleplay_cases(uuid,text) from public;
grant execute on function public.desarrolla_roleplay_cases(uuid,text) to anon,authenticated;

create or replace function public.desarrolla_roleplay_case_get(p_token uuid,p_case_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_s record; v_c private.desarrolla_roleplay_cases%rowtype;
begin
 select * into v_s from private.participa_sesion_actual(p_token);
 if v_s.integrante_id is null then return jsonb_build_object('ok',false,'message','Tu sesión venció. Ingresa nuevamente.'); end if;
 select * into v_c from private.desarrolla_roleplay_cases where id=p_case_id and active;
 if v_c.id is null then return jsonb_build_object('ok',false,'message','El caso no está disponible.'); end if;
 return jsonb_build_object('ok',true,'case',jsonb_build_object(
  'id',v_c.id,'legacy_key',v_c.legacy_key,'competency',v_c.competency,'icon',v_c.icon,'actor_name',v_c.actor_name,'case_name',v_c.case_name,
  'context',v_c.context,'opening',v_c.opening,'goal',v_c.goal,'limit_text',v_c.limit_text,'difficulty',v_c.difficulty,'critical_rules',v_c.critical_rules,
  'guided_choices',v_c.guided_choices,'ai_only',v_c.ai_only
 ));
end $$;
revoke all on function public.desarrolla_roleplay_case_get(uuid,uuid) from public;
grant execute on function public.desarrolla_roleplay_case_get(uuid,uuid) to anon,authenticated;

create or replace function public.desarrolla_admin_roleplay_cases()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
begin
 if not public.is_app_admin() then raise exception 'Acceso no autorizado'; end if;
 return jsonb_build_object('ok',true,'cases',coalesce((
  select jsonb_agg(jsonb_build_object(
   'id',c.id,'legacy_key',c.legacy_key,'competency',c.competency,'icon',c.icon,'actor_name',c.actor_name,'case_name',c.case_name,
   'context',c.context,'opening',c.opening,'goal',c.goal,'limit_text',c.limit_text,'difficulty',c.difficulty,'critical_rules',c.critical_rules,
   'guided_choices',c.guided_choices,'ai_only',c.ai_only,'active',c.active,'sort_order',c.sort_order,'source',c.source,'updated_at',c.updated_at
  ) order by c.competency,c.sort_order,c.created_at)
  from private.desarrolla_roleplay_cases c
 ),'[]'::jsonb));
end $$;
revoke all on function public.desarrolla_admin_roleplay_cases() from public,anon;
grant execute on function public.desarrolla_admin_roleplay_cases() to authenticated;

create or replace function public.desarrolla_admin_roleplay_case_upsert(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_comp text; v_choices jsonb;
begin
 if not public.is_app_admin() then raise exception 'Acceso no autorizado'; end if;
 v_id:=nullif(p_payload->>'id','')::uuid;
 v_comp:=trim(coalesce(p_payload->>'competency',''));
 if v_comp not in ('negotiation','communication','leadership','influence','critical','emotional','finance') then raise exception 'Competencia no válida'; end if;
 if nullif(trim(p_payload->>'actor_name'),'') is null or nullif(trim(p_payload->>'case_name'),'') is null or nullif(trim(p_payload->>'context'),'') is null or nullif(trim(p_payload->>'opening'),'') is null then raise exception 'Faltan campos obligatorios'; end if;
 v_choices:=coalesce(p_payload->'guided_choices','[]'::jsonb);
 if jsonb_typeof(v_choices)<>'array' or jsonb_array_length(v_choices)<3 or jsonb_array_length(v_choices)>6 then raise exception 'Se requieren entre 3 y 6 decisiones guiadas'; end if;
 if v_id is null then
  insert into private.desarrolla_roleplay_cases(competency,icon,actor_name,case_name,context,opening,goal,limit_text,difficulty,critical_rules,guided_choices,ai_only,active,sort_order,source,created_by)
  values(v_comp,left(coalesce(nullif(p_payload->>'icon',''),'🎭'),8),left(trim(p_payload->>'actor_name'),100),left(trim(p_payload->>'case_name'),180),
   left(trim(p_payload->>'context'),1800),left(trim(p_payload->>'opening'),900),left(trim(coalesce(p_payload->>'goal','')),900),
   left(trim(coalesce(p_payload->>'limit_text','')),900),greatest(1,least(coalesce((p_payload->>'difficulty')::int,2),5)),
   left(trim(coalesce(p_payload->>'critical_rules','')),1200),v_choices,
   false,
   coalesce((p_payload->>'active')::boolean,true),coalesce((p_payload->>'sort_order')::int,100),'custom',auth.uid())
  returning id into v_id;
 else
  update private.desarrolla_roleplay_cases set competency=v_comp,icon=left(coalesce(nullif(p_payload->>'icon',''),'🎭'),8),
   actor_name=left(trim(p_payload->>'actor_name'),100),case_name=left(trim(p_payload->>'case_name'),180),context=left(trim(p_payload->>'context'),1800),
   opening=left(trim(p_payload->>'opening'),900),goal=left(trim(coalesce(p_payload->>'goal','')),900),limit_text=left(trim(coalesce(p_payload->>'limit_text','')),900),
   difficulty=greatest(1,least(coalesce((p_payload->>'difficulty')::int,difficulty),5)),critical_rules=left(trim(coalesce(p_payload->>'critical_rules','')),1200),
   guided_choices=v_choices,ai_only=false,
   active=coalesce((p_payload->>'active')::boolean,active),sort_order=coalesce((p_payload->>'sort_order')::int,sort_order),updated_at=now()
  where id=v_id;
  if not found then raise exception 'Caso no encontrado'; end if;
 end if;
 return jsonb_build_object('ok',true,'id',v_id);
end $$;
revoke all on function public.desarrolla_admin_roleplay_case_upsert(jsonb) from public,anon;
grant execute on function public.desarrolla_admin_roleplay_case_upsert(jsonb) to authenticated;

create or replace function public.desarrolla_admin_roleplay_case_delete(p_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
begin
 if not public.is_app_admin() then raise exception 'Acceso no autorizado'; end if;
 delete from private.desarrolla_roleplay_cases where id=p_id;
 if not found then raise exception 'Caso no encontrado'; end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.desarrolla_admin_roleplay_case_delete(uuid) from public,anon;
grant execute on function public.desarrolla_admin_roleplay_case_delete(uuid) to authenticated;

insert into private.desarrolla_roleplay_cases(competency,legacy_key,icon,actor_name,case_name,context,opening,goal,limit_text,difficulty,critical_rules,guided_choices,ai_only,active,sort_order,source)
values
($q$negotiation$q$,$q$trabajador$q$,$q$👷$q$,$q$Trabajador$q$,$q$Rechazo de un respirador$q$,$q$Un operador se niega a usar el respirador porque le produce dolor. Su supervisor exige sanción inmediata.$q$,$q$Ese respirador me lastima. Si me obligan, prefiero no entrar.$q$,$q$Comprender la causa y definir protección provisional y evaluación de ajuste.$q$,$q$No permitir exposición sin protección eficaz.$q$,2,'',$q$[["Preguntar dónde siente dolor y revisar talla, ajuste y tarea.",2,"Diagnosticas la barrera sin renunciar al control."],["Permitirle trabajar hoy sin respirador.",-1,"Creas una exposición no controlada."],["Detener la tarea, verificar ajuste y evaluar alternativas compatibles.",2,"Proteges y buscas una solución eficaz."]]$q$::jsonb,false,true,1,'builtin'),
($q$negotiation$q$,$q$sindicato$q$,$q$🤝$q$,$q$Sindicato$q$,$q$Cambio de turnos por exposición$q$,$q$La empresa propone rotación. El sindicato teme pérdida salarial y que sustituya controles de ingeniería.$q$,$q$No aceptaremos que repartan el riesgo y además afecten los ingresos.$q$,$q$Acordar medidas temporales sin abandonar controles superiores.$q$,$q$La rotación no puede convertirse en sustituto permanente.$q$,2,'',$q$[["Separar medida temporal, impacto laboral y control definitivo.",2,"Estructuras el diálogo y reconoces la preocupación."],["Decir que SST decide y la consulta es informativa.",-1,"Debilitas la participación y pierdes información."],["Compartir mediciones y comparar opciones con criterios comunes.",2,"Construyes una base verificable para decidir."]]$q$::jsonb,false,true,2,'builtin'),
($q$negotiation$q$,$q$directiva$q$,$q$🏢$q$,$q$Junta directiva$q$,$q$Inversión preventiva aplazada$q$,$q$Una medida de ingeniería compite con metas financieras. La dirección pide postergarla seis meses.$q$,$q$No tenemos presupuesto este trimestre. ¿Puede esperar seis meses?$q$,$q$Convertir evidencia técnica en una decisión responsable y trazable.$q$,$q$No aceptar continuidad ante un riesgo que exige intervención inmediata.$q$,2,'',$q$[["Presentar riesgo, obligación, costo total y alternativas por fases.",2,"Conectas prevención, continuidad y decisión."],["Aceptar porque la dirección asume la responsabilidad.",-1,"Debes advertir, documentar y escalar cuando corresponda."],["Repetir que la seguridad no tiene precio.",1,"Es correcto, pero no ayuda a comparar acciones concretas."]]$q$::jsonb,false,true,3,'builtin'),
($q$negotiation$q$,$q$autoridad$q$,$q$⚖️$q$,$q$Autoridad reguladora$q$,$q$Hallazgo durante inspección$q$,$q$Una fiscalización cuestiona un control. Parte de la evidencia aún está en verificación.$q$,$q$Explique por qué este control se consideró suficiente.$q$,$q$Responder con transparencia y un plan verificable.$q$,$q$No ocultar ni presentar como confirmado lo incierto.$q$,2,'',$q$[["Exponer criterio, evidencia, brechas y datos por confirmar.",2,"Distingues hechos e incertidumbre profesionalmente."],["Culpar al contratista.",-1,"Desplazar responsabilidad no responde al hallazgo."],["Solicitar precisión y presentar la trazabilidad del control.",2,"Alineas la respuesta con el hallazgo concreto."]]$q$::jsonb,false,true,4,'builtin'),
($q$negotiation$q$,$q$contratista$q$,$q$🦺$q$,$q$Contratista$q$,$q$Permiso de trabajo incompleto$q$,$q$Un contratista presiona para iniciar una tarea crítica con el permiso incompleto.$q$,$q$Si no arrancamos ahora, ustedes tendrán el retraso.$q$,$q$Coordinar responsabilidades y habilitar solo con controles verificables.$q$,$q$No autorizar sin condiciones seguras y permisos requeridos.$q$,2,'',$q$[["Detener el inicio e identificar requisitos y responsables.",2,"Proteges el límite y abres una solución concreta."],["Firmar con observaciones para que avance.",-1,"Una observación no compensa controles ausentes."],["Priorizar controles críticos y organizar recursos en paralelo.",2,"Reduces demora sin relajar requisitos esenciales."]]$q$::jsonb,false,true,5,'builtin'),
($q$negotiation$q$,$q$comunidad$q$,$q$🌎$q$,$q$Comunidad$q$,$q$Preocupación por emisiones$q$,$q$Vecinos reportan olor y síntomas. La empresa todavía investiga y teme generar alarma.$q$,$q$Ustedes dicen que todo está bien, pero sentimos el olor cada noche.$q$,$q$Escuchar, comunicar lo conocido y acordar seguimiento.$q$,$q$No minimizar reportes ni afirmar seguridad absoluta sin evidencia.$q$,2,'',$q$[["Reconocer reportes, pedir patrones y explicar qué se investigará.",2,"Obtienes información sin prejuzgar el resultado."],["Afirmar que los síntomas no provienen de la empresa.",-1,"No puedes descartar causalidad sin evaluación."],["Proponer monitoreo dirigido y un canal de reportes.",2,"Transformas la preocupación en un proceso verificable."]]$q$::jsonb,false,true,6,'builtin'),
($q$communication$q$,$q$trabajador$q$,$q$👷$q$,$q$Trabajador$q$,$q$Corrección de una conducta insegura$q$,$q$Un trabajador retira una barrera para avanzar más rápido.$q$,$q$Siempre lo hacemos así y nunca ha pasado nada.$q$,$q$$q$,$q$$q$,2,'',$q$[["Eres irresponsable; coloca la barrera ya.",-1,"Etiquetas a la persona y generas resistencia."],["Observé la barrera retirada; hay acceso al peligro. Detengamos y revisemos una forma segura.",2,"Describes hecho, riesgo y acción."],["Recuerda tener más cuidado.",0,"La solicitud es ambigua y el peligro continúa."]]$q$::jsonb,false,true,1,'builtin'),
($q$communication$q$,$q$sindicato$q$,$q$🤝$q$,$q$Sindicato$q$,$q$Resultados sensibles$q$,$q$Debes comunicar resultados preliminares de exposición.$q$,$q$¿La empresa está ocultando que hay personas sobreexpuestas?$q$,$q$$q$,$q$$q$,2,'',$q$[["Eso es falso y están generando alarma.",-1,"Confrontas sin responder la preocupación."],["Explicaré qué está confirmado, qué falta validar y qué medidas activamos.",2,"Distingues evidencia, incertidumbre y acción."],["No hablaremos hasta tener el informe final.",0,"El silencio aumenta desconfianza."]]$q$::jsonb,false,true,2,'builtin'),
($q$communication$q$,$q$directiva$q$,$q$🏢$q$,$q$Junta directiva$q$,$q$Decisión urgente$q$,$q$Necesitas aprobación para una medida temporal y una solución definitiva.$q$,$q$Resúmalo: ¿qué decisión necesita hoy?$q$,$q$$q$,$q$$q$,2,'',$q$[["Mostrar primero veinte diapositivas técnicas.",0,"No adaptas el mensaje al propósito."],["Presentar riesgo, evidencia, opciones, recomendación y decisión requerida.",2,"Facilitas una decisión informada."],["Advertir que todo rechazo será responsabilidad de la junta.",-1,"La amenaza bloquea el análisis."]]$q$::jsonb,false,true,3,'builtin'),
($q$communication$q$,$q$autoridad$q$,$q$⚖️$q$,$q$Autoridad reguladora$q$,$q$Observación de fiscalización$q$,$q$Existe contradicción entre el procedimiento y la práctica observada.$q$,$q$El documento dice una cosa y en terreno vimos otra.$q$,$q$$q$,$q$$q$,2,'',$q$[["El inspector interpretó mal.",-1,"Niegas sin verificar y personalizas."],["Describir la discrepancia, control inmediato y plazo de respuesta formal.",2,"Combinas transparencia y trazabilidad."],["Enviar nuevamente el procedimiento.",0,"No respondes al hallazgo."]]$q$::jsonb,false,true,4,'builtin'),
($q$communication$q$,$q$contratista$q$,$q$🦺$q$,$q$Contratista$q$,$q$Cambio crítico no comprendido$q$,$q$El contratista dice no haber recibido un cambio de aislamiento enviado por correo.$q$,$q$Nadie nos explicó ese cambio antes de comenzar.$q$,$q$$q$,$q$$q$,2,'',$q$[["Yo envié el correo; era su obligación leerlo.",0,"El canal no demuestra comprensión."],["Detener, confirmar información y reautorizar tras verificación cara a cara.",2,"Priorizas comprensión efectiva."],["Permitir terminar el turno.",-1,"Mantienes una tarea con información crítica ausente."]]$q$::jsonb,false,true,5,'builtin'),
($q$communication$q$,$q$comunidad$q$,$q$🌎$q$,$q$Comunidad$q$,$q$Información bajo incertidumbre$q$,$q$Vecinos preguntan por humo mientras aún se evalúa el alcance.$q$,$q$¿Estamos en peligro? Queremos una respuesta clara.$q$,$q$$q$,$q$$q$,2,'',$q$[["No hay peligro; mantengan la calma.",-1,"Das seguridad absoluta sin evidencia."],["Explicar lo confirmado, lo desconocido, protección y próxima actualización.",2,"Comunicas incertidumbre con orientación."],["Publicar solo la norma aplicable.",0,"No traduces la información a sus necesidades."]]$q$::jsonb,false,true,6,'builtin'),
($q$leadership$q$,$q$equipo$q$,$q$👷$q$,$q$Equipo de trabajo$q$,$q$Reporte ignorado$q$,$q$El equipo dice que informó varias veces una fuga menor sin recibir respuesta.$q$,$q$¿Para qué reportar si nunca pasa nada?$q$,$q$$q$,$q$$q$,2,'',$q$[["Pedir que vuelvan a llenar el formulario.",0,"Repites el canal sin reparar la falta de respuesta."],["Reconocer la demora, controlar la fuga y explicar responsable, plazo y seguimiento.",2,"Recuperas confianza mediante acción y trazabilidad."],["Recordarles que reportar es su obligación.",-1,"Usas la obligación para evadir el incumplimiento de gestión."]]$q$::jsonb,false,true,1,'builtin'),
($q$leadership$q$,$q$supervisor$q$,$q$🧭$q$,$q$Supervisor operativo$q$,$q$Presión por producción$q$,$q$Un supervisor pide omitir una verificación para recuperar tiempo.$q$,$q$Solo esta vez; yo asumo la responsabilidad.$q$,$q$$q$,$q$$q$,2,'',$q$[["Aceptar por tratarse de una excepción.",-1,"La responsabilidad declarada no elimina el riesgo."],["Mantener el control y ayudar a reorganizar la tarea para reducir la demora.",2,"Muestras coherencia y colaboración operativa."],["Citar la política y retirarte.",0,"Sostienes el límite, pero no lideras una solución viable."]]$q$::jsonb,false,true,2,'builtin'),
($q$leadership$q$,$q$directiva$q$,$q$🏢$q$,$q$Junta directiva$q$,$q$Prioridad preventiva$q$,$q$La dirección pide escoger entre varias inversiones de SST con información incompleta.$q$,$q$¿Cuál debe aprobarse primero y por qué?$q$,$q$$q$,$q$$q$,2,'',$q$[["Elegir la opción más visible para mostrar compromiso.",0,"Visibilidad no equivale a reducción de riesgo."],["Comparar daño, exposición, requisito, eficacia, incertidumbre y urgencia.",2,"Das criterios transparentes para priorizar."],["Indicar que todas son igualmente urgentes.",-1,"Evitas la decisión y reduces credibilidad."]]$q$::jsonb,false,true,3,'builtin'),
($q$leadership$q$,$q$sindicato$q$,$q$🤝$q$,$q$Sindicato$q$,$q$Cambio sin participación$q$,$q$El sindicato reclama que un nuevo procedimiento se diseñó sin trabajadores.$q$,$q$Nos llaman cuando todo ya está decidido.$q$,$q$$q$,$q$$q$,2,'',$q$[["Explicar que el equipo técnico conoce mejor el riesgo.",-1,"Desvalorizas conocimiento del trabajo real."],["Reconocer la brecha, pausar la implantación y realizar una prueba participativa.",2,"Conviertes el reclamo en mejora del cambio."],["Abrir un buzón de sugerencias después de implantar.",0,"La participación llega demasiado tarde."]]$q$::jsonb,false,true,4,'builtin'),
($q$leadership$q$,$q$contratista$q$,$q$🦺$q$,$q$Contratista$q$,$q$Desempeño repetidamente deficiente$q$,$q$Se repiten permisos incompletos pese a correcciones anteriores.$q$,$q$Ya corregimos el documento. ¿Qué más quieren?$q$,$q$$q$,$q$$q$,2,'',$q$[["Aplicar sanción automática sin investigar.",0,"Puede ser necesaria una consecuencia, pero falta análisis causal."],["Verificar causas, capacidad, supervisión y acordar hitos con escalamiento.",2,"Combinas desarrollo, responsabilidad y seguimiento."],["Aceptar la corrección documental y cerrar.",-1,"No verificas el desempeño real ni la recurrencia."]]$q$::jsonb,false,true,5,'builtin'),
($q$leadership$q$,$q$comunidad$q$,$q$🌎$q$,$q$Comunidad$q$,$q$Pérdida de confianza$q$,$q$Representantes comunitarios afirman que los compromisos anteriores no se cumplieron.$q$,$q$Prometieron informar mensualmente y dejaron de hacerlo.$q$,$q$$q$,$q$$q$,2,'',$q$[["Explicar que hubo cambios internos.",0,"Da contexto, pero no repara el compromiso."],["Reconocer el incumplimiento, entregar estado verificable y restablecer responsables y fechas.",2,"Lideras con rendición de cuentas."],["Pedir que envíen un reclamo formal.",-1,"Trasladas a la comunidad la carga de tu falta de seguimiento."]]$q$::jsonb,false,true,6,'builtin'),
($q$influence$q$,$q$gerencia$q$,$q$🏢$q$,$q$Gerencia general$q$,$q$Presupuesto para control crítico$q$,$q$Un control de ingeniería requiere inversión y compite con otras prioridades.$q$,$q$¿Por qué esto debe financiarse ahora?$q$,$q$$q$,$q$$q$,2,'',$q$[["Porque seguridad siempre debe ser prioridad.",1,"El principio es válido, pero falta mostrar el caso concreto."],["Presentar riesgo, exposición, obligación, impacto, opciones y recomendación.",2,"Conectas evidencia y decisión sin abandonar el límite."],["Exagerar la probabilidad para asegurar aprobación.",-1,"La manipulación daña ética y credibilidad."]]$q$::jsonb,false,true,1,'builtin'),
($q$influence$q$,$q$finanzas$q$,$q$📊$q$,$q$Finanzas$q$,$q$Solicitud de recursos$q$,$q$Finanzas cuestiona una estimación de costo evitado y pide supuestos verificables.$q$,$q$Ese ahorro parece demasiado optimista.$q$,$q$$q$,$q$$q$,2,'',$q$[["Ocultar el cálculo para evitar discusión.",-1,"Impides una decisión informada."],["Separar datos, supuestos y rango de incertidumbre; comparar escenarios.",2,"Fortaleces la propuesta con transparencia."],["Eliminar todo argumento económico.",0,"Pierdes una dimensión útil, aunque no única."]]$q$::jsonb,false,true,2,'builtin'),
($q$influence$q$,$q$operaciones$q$,$q$⚙️$q$,$q$Operaciones$q$,$q$Control que afecta producción$q$,$q$Operaciones teme que la medida reduzca capacidad durante tres semanas.$q$,$q$Su propuesta compromete nuestra entrega principal.$q$,$q$$q$,$q$$q$,2,'',$q$[["Decir que producción nunca puede estar sobre seguridad.",1,"Sostienes el principio, pero aún falta resolver la implementación."],["Explorar fases eficaces, ventana operativa y riesgo residual con criterios comunes.",2,"Integras prevención y continuidad legítimamente."],["Suavizar el requisito hasta que no afecte producción.",-1,"Subordinas la eficacia preventiva a la comodidad operativa."]]$q$::jsonb,false,true,3,'builtin'),
($q$influence$q$,$q$trabajadores$q$,$q$👷$q$,$q$Trabajadores$q$,$q$Alianza para un cambio$q$,$q$Una medida necesita respaldo de quienes realizan el trabajo, pero existe desconfianza.$q$,$q$Siempre nos consultan cuando ya compraron la solución.$q$,$q$$q$,$q$$q$,2,'',$q$[["Mostrar que el proveedor garantiza el resultado.",0,"La garantía no sustituye participación ni prueba en terreno."],["Reconocer la historia, acordar criterios y probar opciones con usuarios.",2,"Construyes legitimidad e incorporas conocimiento real."],["Pedir apoyo porque la medida ya fue aprobada.",-1,"Confundes comunicación con participación."]]$q$::jsonb,false,true,4,'builtin'),
($q$influence$q$,$q$autoridad$q$,$q$⚖️$q$,$q$Autoridad reguladora$q$,$q$Plan de cumplimiento$q$,$q$Debes presentar un plan realista luego de un hallazgo relevante.$q$,$q$¿Qué garantiza que esta vez sí cumplirán?$q$,$q$$q$,$q$$q$,2,'',$q$[["Prometer resolución inmediata de todo.",0,"Una promesa inviable no crea confianza."],["Mostrar responsables, recursos aprobados, hitos, evidencia y escalamiento.",2,"Sustentas capacidad y seguimiento verificable."],["Minimizar el hallazgo porque no hubo daño.",-1,"Ausencia de accidente no demuestra control."]]$q$::jsonb,false,true,5,'builtin'),
($q$influence$q$,$q$comunidad$q$,$q$🌎$q$,$q$Comunidad$q$,$q$Proyecto con preocupación social$q$,$q$La comunidad teme que una ampliación aumente exposición y no confía en el monitoreo interno.$q$,$q$¿Por qué deberíamos creer en sus datos?$q$,$q$$q$,$q$$q$,2,'',$q$[["Afirmar que la empresa cumple todas las normas.",0,"Cumplimiento declarado no responde a la confianza ni a los datos."],["Acordar indicadores, acceso a resultados, revisión independiente y canal de seguimiento.",2,"Creas verificabilidad y participación."],["Ofrecer beneficios comunitarios a cambio de apoyo.",-1,"Puede convertirse en presión indebida y no controla el riesgo."]]$q$::jsonb,false,true,6,'builtin'),
($q$critical$q$,$q$incidente$q$,$q$⚠️$q$,$q$Investigación de incidente$q$,$q$Culpa inmediata$q$,$q$Un supervisor concluye que el accidente ocurrió porque el trabajador no siguió el procedimiento.$q$,$q$Está claro: fue error humano.$q$,$q$$q$,$q$$q$,2,'',$q$[["Aceptar la explicación porque coincide con el registro.",0,"El dato puede ser cierto, pero no explica las condiciones que lo hicieron posible."],["Verificar tarea real, controles, formación, presión, diseño y decisiones previas.",2,"Amplías el análisis causal sin excluir responsabilidad individual."],["Afirmar que nunca existe error humano.",-1,"Sustituyes una simplificación por otra."]]$q$::jsonb,false,true,1,'builtin'),
($q$critical$q$,$q$medicion$q$,$q$📏$q$,$q$Evaluación higiénica$q$,$q$Muestra insuficiente$q$,$q$Una medición única salió bajo el límite y operaciones quiere cerrar el caso.$q$,$q$El valor cumple; no hace falta medir más.$q$,$q$$q$,$q$$q$,2,'',$q$[["Cerrar porque el número está bajo el criterio.",-1,"Ignoras representatividad, variabilidad e incertidumbre."],["Revisar estrategia, tarea, tiempo, método, incertidumbre y peor escenario razonable.",2,"Evalúas si la evidencia responde realmente la pregunta."],["Descartar toda medición única como inútil.",0,"Puede aportar información, aunque rara vez cierre por sí sola el análisis."]]$q$::jsonb,false,true,2,'builtin'),
($q$critical$q$,$q$proveedor$q$,$q$🧪$q$,$q$Proveedor técnico$q$,$q$Afirmación comercial$q$,$q$Un vendedor afirma que su producto reduce 90 % del riesgo y presenta un folleto sin método.$q$,$q$Está certificado y funciona en cualquier industria.$q$,$q$$q$,$q$$q$,2,'',$q$[["Aceptar por la certificación y reputación de la marca.",0,"La autoridad de la marca no demuestra eficacia en tu contexto."],["Pedir alcance, método, comparador, condiciones, limitaciones y evidencia independiente.",2,"Evalúas calidad y aplicabilidad de la afirmación."],["Rechazar cualquier evidencia financiada por fabricantes.",-1,"El financiamiento exige análisis del sesgo, no rechazo automático."]]$q$::jsonb,false,true,3,'builtin'),
($q$critical$q$,$q$ia$q$,$q$🤖$q$,$q$Asistente de IA$q$,$q$Respuesta convincente$q$,$q$Una IA entrega una norma, fecha y límite que parecen precisos, pero no incluye fuente verificable.$q$,$q$La respuesta está bien escrita y coincide con lo que recordábamos.$q$,$q$$q$,$q$$q$,2,'',$q$[["Usarla porque coincide con la experiencia del equipo.",-1,"Coherencia aparente no demuestra exactitud ni vigencia."],["Verificar texto oficial, jurisdicción, edición, alcance y fecha antes de decidir.",2,"Usas IA como apoyo, no como autoridad final."],["Prohibir toda IA en SST.",0,"Elimina una herramienta útil en vez de gestionar sus límites."]]$q$::jsonb,false,true,4,'builtin'),
($q$critical$q$,$q$directiva$q$,$q$🏢$q$,$q$Junta directiva$q$,$q$Datos incompletos$q$,$q$La dirección debe decidir una medida provisional antes de terminar una investigación.$q$,$q$Si no hay certeza, ¿por qué actuar ahora?$q$,$q$$q$,$q$$q$,2,'',$q$[["Esperar certeza total.",-1,"Puede dejar expuestas a personas ante un daño potencial grave."],["Explicar daño plausible, evidencia, incertidumbre, medida reversible y criterio de revisión.",2,"Propones una decisión proporcional y adaptable."],["Presentar la hipótesis más grave como un hecho.",0,"Puede impulsar acción, pero vulnera la calidad de la decisión."]]$q$::jsonb,false,true,5,'builtin'),
($q$critical$q$,$q$comite$q$,$q$👥$q$,$q$Comité de SST$q$,$q$Consenso prematuro$q$,$q$Todo el comité apoya la primera solución y nadie plantea alternativas.$q$,$q$Todos estamos de acuerdo; avancemos.$q$,$q$$q$,$q$$q$,2,'',$q$[["Aprobar porque el consenso demuestra que es la mejor opción.",0,"El consenso puede reflejar conformidad o presión jerárquica."],["Nombrar una revisión crítica: alternativas, evidencia contraria y riesgo residual.",2,"Introduces contraste sin bloquear la decisión."],["Oponerte automáticamente para demostrar independencia.",-1,"Pensamiento crítico no significa contradecir por sistema."]]$q$::jsonb,false,true,6,'builtin'),
($q$emotional$q$,$q$trabajador$q$,$q$👷$q$,$q$Trabajador alterado$q$,$q$Después de un incidente$q$,$q$Un trabajador grita que la empresa lo obligó a realizar la tarea.$q$,$q$¡A ustedes solo les importa llenar papeles!$q$,$q$$q$,$q$$q$,2,'',$q$[["Responder que deje de gritar o será sancionado.",-1,"Escalas antes de evaluar seguridad y contenido."],["Bajar el ritmo, asegurar atención inmediata y escuchar hechos sin discutir culpas.",2,"Priorizas contención, seguridad y obtención de información."],["Explicar de inmediato todo el procedimiento.",0,"La persona puede no estar en condiciones de procesar una explicación extensa."]]$q$::jsonb,false,true,1,'builtin'),
($q$emotional$q$,$q$supervisor$q$,$q$🧭$q$,$q$Supervisor hostil$q$,$q$Cuestionamiento público$q$,$q$Un supervisor ridiculiza tu recomendación delante del equipo.$q$,$q$Otra vez SST frenando el trabajo por cosas teóricas.$q$,$q$$q$,$q$$q$,2,'',$q$[["Responder con sarcasmo para defender autoridad.",-1,"Conviertes el conflicto técnico en confrontación personal."],["Nombrar el límite, volver al riesgo y proponer revisar evidencia en un espacio adecuado.",2,"Proteges respeto y propósito sin evitar el desacuerdo."],["Guardar silencio y retirarte siempre.",0,"Puede prevenir escalamiento inmediato, pero deja el riesgo y la conducta sin abordar."]]$q$::jsonb,false,true,2,'builtin'),
($q$emotional$q$,$q$sindicato$q$,$q$🤝$q$,$q$Representante sindical$q$,$q$Reunión en alta tensión$q$,$q$La discusión por turnos se vuelve acusatoria y varias personas hablan a la vez.$q$,$q$Ustedes ya decidieron todo; esta reunión es una farsa.$q$,$q$$q$,$q$$q$,2,'',$q$[["Demostrar rápidamente que están equivocados.",0,"Más argumentos en alta activación suelen aumentar tensión."],["Reconocer la desconfianza, ordenar turnos y acordar qué decisión sigue abierta.",2,"Reduce activación y devuelve estructura al diálogo."],["Finalizar la reunión culpando al sindicato.",-1,"Cierra sin condiciones de aprendizaje ni seguimiento."]]$q$::jsonb,false,true,3,'builtin'),
($q$emotional$q$,$q$directiva$q$,$q$🏢$q$,$q$Alta dirección$q$,$q$Presión y miedo$q$,$q$Te exigen afirmar que un evento no representa riesgo reputacional antes de terminar la investigación.$q$,$q$Necesitamos que tranquilice a todos ahora mismo.$q$,$q$$q$,$q$$q$,2,'',$q$[["Aceptar para proteger a la organización.",-1,"La presión no justifica una afirmación sin evidencia."],["Reconocer la urgencia y proponer un mensaje provisional veraz con próxima actualización.",2,"Regulas la presión y ofreces una alternativa ética."],["Negarte sin explicar ninguna alternativa.",0,"Mantienes independencia, pero no ayudas a gestionar la situación."]]$q$::jsonb,false,true,4,'builtin'),
($q$emotional$q$,$q$comunidad$q$,$q$🌎$q$,$q$Comunidad angustiada$q$,$q$Temor por exposición$q$,$q$Una madre expresa miedo por síntomas en sus hijos durante una reunión comunitaria.$q$,$q$¿Y si esto les causa daño para siempre?$q$,$q$$q$,$q$$q$,2,'',$q$[["Decir que no debe alarmarse sin pruebas.",-1,"Minimizas su emoción y afirmas más de lo que sabes."],["Reconocer la preocupación, explicar certezas y límites, y activar orientación sanitaria y seguimiento.",2,"Combinas empatía, rigor y acción."],["Responder únicamente con valores técnicos.",0,"Aporta datos, pero no responde a la necesidad de comprensión y protección."]]$q$::jsonb,false,true,5,'builtin'),
($q$emotional$q$,$q$colega$q$,$q$🧠$q$,$q$Colega de SST$q$,$q$Desgaste persistente$q$,$q$Un colega dice que no duerme, se siente desbordado y teme cometer errores.$q$,$q$No puedo más, pero si paro dejo solo al equipo.$q$,$q$$q$,$q$$q$,2,'',$q$[["Decir que todos pasan por lo mismo.",-1,"Normalizas señales relevantes y refuerzas el aislamiento."],["Escuchar, reducir demandas inmediatas y activar apoyo profesional y organizacional.",2,"Reconoces límites y conectas con recursos adecuados."],["Dar consejos clínicos basados en tu experiencia.",0,"El apoyo humano ayuda, pero no debes exceder tu competencia."]]$q$::jsonb,false,true,6,'builtin')
on conflict (competency,legacy_key) where legacy_key is not null do update set
 icon=excluded.icon,actor_name=excluded.actor_name,case_name=excluded.case_name,context=excluded.context,opening=excluded.opening,
 goal=excluded.goal,limit_text=excluded.limit_text,guided_choices=excluded.guided_choices,sort_order=excluded.sort_order,updated_at=now();


-- Progresión guiada por dificultad: los casos base avanzan de 1 a 3 eventos adaptativos.
update private.desarrolla_roleplay_cases
set difficulty = case
  when sort_order <= 2 then 2
  when sort_order <= 4 then 3
  else 4
end,
updated_at=now()
where source='builtin'
  and competency in ('negotiation','communication','leadership','influence','critical','emotional');

update private.desarrolla_roleplay_cases
set ai_only=false,
    active=case when jsonb_array_length(coalesce(guided_choices,'[]'::jsonb))>=3 then active else false end,
    updated_at=now();
