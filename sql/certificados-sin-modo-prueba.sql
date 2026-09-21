-- Certificados Desarrolla SST · emisión sin marca de prueba visible
-- La bandera de QA no se expone al generador ni a la lista de rutas certificables.

do $$
declare s text;
begin
  select pg_get_functiondef(p.oid) into s
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='desarrolla_generar_certificado'
  limit 1;

  s:=replace(
    s,
    'select o.otorgada_at,o.modo_prueba into v_completada_at,v_prueba',
    'select o.otorgada_at,false into v_completada_at,v_prueba'
  );
  s:=replace(s,'''prueba'',v_prueba','''prueba'',false');
  execute s;

  select pg_get_functiondef(p.oid) into s
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='desarrolla_rutas_certificables'
  limit 1;

  s:=replace(
    s,
    '''codigo'',q.diagnostico,''prueba'',q.prueba',
    '''codigo'',q.diagnostico,''prueba'',false'
  );
  execute s;
end $$;
