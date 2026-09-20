(()=>{"use strict";
const U="https://lfdmbkzghnwvsapxypvt.supabase.co";
const K="sb_publishable_bRnkA6PA8-v073nrw9zxiQ_8rVGiOn1";
const API=U+"/functions/v1/desarrolla-roleplay-calibration";
const $=id=>document.getElementById(id);
const client=supabase.createClient(U,K);
const bank=window.DesarrollaCalibrationBank;
let running=false;
let controller=null;
let lastRun=null;

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pct=(n,d)=>d?Math.round((n*1000)/d)/10:0;
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const median=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2};
const date=v=>v?new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):"—";

function selectedTests(){
 let tests=bank.tests.slice();
 const scope=$("calScope").value;
 const comp=$("calCompetency").value;
 const level=$("calLevel").value;
 if(scope==="smoke")tests=tests.filter(x=>/1-/.test(x.id));
 if(comp)tests=tests.filter(x=>x.competency===comp);
 if(level)tests=tests.filter(x=>x.level===level);
 return tests;
}

function updateCount(){
 const count=selectedTests().length;
 const reps=Number($("calRepeats").value)||1;
 $("calRun").textContent=`Ejecutar ${count} prueba${count===1?"":"s"}${reps>1?` × ${reps}`:""}`;
}

function setProgress(done,total,label){
 const value=total?Math.round((done/total)*100):0;
 $("calProgress").hidden=false;
 $("calProgressText").textContent=label||`${done} de ${total}`;
 $("calProgressPct").textContent=value+"%";
 $("calProgressBar").style.width=value+"%";
}

async function adminSession(){
 const {data:{session}}=await client.auth.getSession();
 if(!session)throw new Error("Sesión administrativa requerida.");
 const {data:isAdmin,error}=await client.rpc("is_app_admin");
 if(error||isAdmin!==true)throw new Error("La cuenta no tiene permiso administrativo.");
 return session;
}

async function batchCall(session,items){
 const response=await fetch(API,{
  method:"POST",
  signal:controller?.signal,
  headers:{
   "Content-Type":"application/json",
   "Authorization":`Bearer ${session.access_token}`
  },
  body:JSON.stringify({
   tests:items.map(x=>({
    id:x.test.id,
    competency:x.test.competency,
    answer:x.test.answer,
    scenario:x.test.scenario
   }))
  })
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data?.ok)throw new Error(data?.message||"Falló un lote de calibración.");
 return data;
}

function normalizeAttempt(item,result){
 if(!result?.ok){
  return{
   test_id:item.test.id,
   competency:item.test.competency,
   level:item.test.level,
   repeat:item.repeat,
   error:result?.error||"Error de evaluación",
   passed:false
  };
 }
 const ev=result.evaluation||{};
 const score=Number(ev.total||0);
 const expected=item.test.expected;
 const rangePass=score>=expected.min&&score<=expected.max;
 const critical=Boolean(ev.riesgo_critico);
 const criticalPass=critical===Boolean(expected.critical);
 return{
  test_id:item.test.id,
  competency:item.test.competency,
  level:item.test.level,
  repeat:item.repeat,
  model:result.model,
  score,
  critical,
  expected_critical:expected.critical,
  range_min:expected.min,
  range_max:expected.max,
  range_pass:rangePass,
  critical_pass:criticalPass,
  passed:rangePass&&criticalPass,
  quality:ev.quality||"",
  status:ev.conversation?.status||"",
  dimensions:ev.dimensions||[],
  fortaleza:ev.fortaleza||"",
  oportunidad:ev.oportunidad||""
 };
}

function summarize(results){
 const ok=results.filter(x=>!x.error);
 const total=results.length;
 const passed=results.filter(x=>x.passed).length;
 const rangePassed=results.filter(x=>x.range_pass).length;
 const criticalPassed=results.filter(x=>x.critical_pass).length;
 let tp=0,tn=0,fp=0,fn=0;
 for(const x of ok){
  if(x.expected_critical&&x.critical)tp++;
  else if(x.expected_critical&&!x.critical)fn++;
  else if(!x.expected_critical&&x.critical)fp++;
  else tn++;
 }
 const deviation=ok.map(x=>Math.abs(x.score-(x.range_min+x.range_max)/2));
 const grouped={};
 for(const x of ok)(grouped[x.test_id]??=[]).push(x);
 let consistent=0;
 let consistencyGroups=0;
 for(const rows of Object.values(grouped)){
  if(rows.length<2)continue;
  consistencyGroups++;
  const scores=rows.map(x=>x.score);
  const criticalStable=new Set(rows.map(x=>x.critical)).size===1;
  if(Math.max(...scores)-Math.min(...scores)<=12&&criticalStable)consistent++;
 }
 const byComp={};
 for(const key of Object.keys(bank.competencies)){
  const rows=results.filter(x=>x.competency===key);
  if(!rows.length)continue;
  const good=rows.filter(x=>x.passed).length;
  byComp[key]={
   attempts:rows.length,
   passed:good,
   pass_rate:pct(good,rows.length),
   median_score:median(rows.filter(x=>!x.error).map(x=>x.score))
  };
 }
 const passRate=pct(passed,total);
 const criticalRecall=pct(tp,tp+fn);
 const consistencyRate=consistencyGroups?pct(consistent,consistencyGroups):null;
 const qualityGate=passRate>=80&&criticalRecall>=95&&fn===0&&(consistencyRate==null||consistencyRate>=80)&&total-ok.length===0;
 return{
  total_attempts:total,
  successful:ok.length,
  errors:total-ok.length,
  passed,
  pass_rate:passRate,
  range_pass_rate:pct(rangePassed,total),
  critical_accuracy:pct(criticalPassed,total),
  critical_recall:criticalRecall,
  critical_precision:pct(tp,tp+fp),
  false_positives:fp,
  false_negatives:fn,
  mean_abs_midpoint_deviation:Math.round(mean(deviation)*10)/10,
  consistency_groups:consistencyGroups,
  consistency_pass_rate:consistencyRate,
  quality_gate:qualityGate,
  quality_gate_rule:"Aprobación ≥80%, recall crítico ≥95%, 0 falsos negativos críticos, consistencia ≥80% cuando aplica y 0 errores técnicos.",
  by_competency:byComp
 };
}

function aggregate(results){
 const groups={};
 for(const row of results)(groups[row.test_id]??=[]).push(row);
 return Object.entries(groups).map(([id,rows])=>({
  id,
  rows,
  test:bank.tests.find(x=>x.id===id)
 }));
}

function render(summary,results,meta){
 $("calMetrics").hidden=false;
 $("calReport").hidden=false;
 $("calCsv").disabled=false;
 $("calMetrics").innerHTML=[
  ["Gate de calidad",summary.quality_gate?"APROBADO":"REVISAR"],
  ["Aprobación global",summary.pass_rate+"%"],
  ["Rango esperado",summary.range_pass_rate+"%"],
  ["Detección crítica",summary.critical_accuracy+"%"],
  ["Recall crítico",summary.critical_recall+"%"],
  ["Falsos positivos",summary.false_positives],
  ["Falsos negativos",summary.false_negatives],
  ["Desviación media",summary.mean_abs_midpoint_deviation+" pts"],
  ["Consistencia",summary.consistency_pass_rate==null?"—":summary.consistency_pass_rate+"%"]
 ].map(x=>`<article><span>${x[0]}</span><b>${x[1]}</b></article>`).join("");

 $("calReportMeta").textContent=`${meta.tests} casos · ${meta.repetitions} repetición${meta.repetitions===1?"":"es"} · ${meta.model||"modelo no reportado"} · banco ${bank.version} · ${summary.quality_gate?"gate aprobado":"requiere revisión"}`;

 const cards=Object.entries(summary.by_competency).map(([key,value])=>`
  <article>
   <b>${esc(bank.competencies[key])}</b>
   <p>${value.pass_rate}% dentro de criterio · mediana ${value.median_score}% · ${value.passed}/${value.attempts} intentos aprobados</p>
  </article>`).join("");
 $("calDiagnostics").innerHTML=cards+`
  <article><b>Riesgo crítico</b><p>Precisión ${summary.critical_precision}% · recall ${summary.critical_recall}% · FP ${summary.false_positives} · FN ${summary.false_negatives}</p></article>
  <article><b>Lectura</b><p>Una falla identifica un patrón que debe revisarse en la rúbrica, el prompt o el rango esperado; no se corrige automáticamente.</p></article>`;

 $("calRows").innerHTML=aggregate(results).map(group=>{
  const scores=group.rows.filter(x=>!x.error).map(x=>x.score);
  const passCount=group.rows.filter(x=>x.passed).length;
  const critical=group.rows.filter(x=>!x.error).map(x=>x.critical);
  const allPass=passCount===group.rows.length&&!group.rows.some(x=>x.error);
  const spread=scores.length>1?Math.max(...scores)-Math.min(...scores):null;
  return`<tr>
   <td><b>${esc(group.id)}</b><small>${esc(group.test.scenario.caseName)}</small></td>
   <td>${esc(bank.competencies[group.test.competency])}</td>
   <td>${esc(group.test.level)}</td>
   <td>${group.test.expected.min}–${group.test.expected.max}%<small>Crítico: ${group.test.expected.critical?"sí":"no"}</small></td>
   <td><strong>${scores.length?scores.join(" · ")+"%":"Error"}</strong><small>${spread!=null?"amplitud "+spread+" pts":""}</small></td>
   <td>${critical.length?critical.map(v=>v?"Sí":"No").join(" · "):"—"}</td>
   <td class="${allPass?"cal-pass":"cal-fail"}">${allPass?"Cumple":passCount+"/"+group.rows.length+" cumple"}</td>
  </tr>`;
 }).join("");
}

function downloadCsv(results){
 const headers=["test_id","competency","level","repeat","score","range_min","range_max","critical","expected_critical","range_pass","critical_pass","passed","model","error"];
 const quote=value=>`"${String(value??"").replace(/"/g,'""')}"`;
 const rows=[headers.join(",")].concat(results.map(row=>headers.map(key=>quote(row[key])).join(",")));
 const blob=new Blob([rows.join("\n")],{type:"text/csv;charset=utf-8"});
 const anchor=document.createElement("a");
 anchor.href=URL.createObjectURL(blob);
 anchor.download=`calibracion-desarrolla-${new Date().toISOString().slice(0,10)}.csv`;
 anchor.click();
 setTimeout(()=>URL.revokeObjectURL(anchor.href),1000);
}

async function saveRun(summary,results,meta,status){
 const compact=results.map(x=>({
  test_id:x.test_id,
  competency:x.competency,
  level:x.level,
  repeat:x.repeat,
  score:x.score??null,
  critical:x.critical??null,
  passed:x.passed,
  error:x.error||null,
  model:x.model||null,
  status:x.status||null,
  dimensions:x.dimensions||[]
 }));
 const {data,error}=await client.rpc("desarrolla_calibration_guardar",{
  p_bank_version:bank.version,
  p_model:meta.model||"",
  p_repetitions:meta.repetitions,
  p_summary:summary,
  p_results:compact,
  p_status:status
 });
 if(error)throw error;
 return data;
}

async function loadHistory(){
 const {data,error}=await client.rpc("desarrolla_calibration_historial",{p_limit:12});
 if(error){
  $("calHistory").innerHTML="<p>No se pudo cargar el historial.</p>";
  return;
 }
 const rows=Array.isArray(data)?data:[];
 $("calHistory").innerHTML=rows.length?rows.map(x=>`
  <article>
   <div>
    <h3>${date(x.created_at)} · banco ${esc(x.bank_version)}</h3>
    <p>${x.total_tests} intentos · ${x.repetitions} repetición${x.repetitions===1?"":"es"} · ${esc(x.model||"modelo no registrado")}</p>
   </div>
   <div>
    <strong class="${esc(x.status)}">${x.summary?.pass_rate??0}%</strong>
    <p>${esc(x.status)}</p>
   </div>
  </article>`).join(""):"<p>Aún no hay calibraciones guardadas.</p>";
}

async function run(){
 if(running)return;
 const tests=selectedTests();
 const repetitions=Number($("calRepeats").value)||1;
 if(!tests.length){
  $("calMessage").textContent="No hay pruebas con esos filtros.";
  return;
 }

 running=true;
 controller=new AbortController();
 $("calRun").disabled=true;
 $("calCancel").disabled=false;
 $("calCsv").disabled=true;
 $("calMessage").textContent="";
 let results=[];
 let model="";
 let status="completed";

 try{
  const session=await adminSession();
  const queue=[];
  for(let repeat=1;repeat<=repetitions;repeat++){
   for(const test of tests)queue.push({test,repeat});
  }

  for(let index=0;index<queue.length;index+=4){
   if(!running){
    status="partial";
    break;
   }

   const items=queue.slice(index,index+4);
   setProgress(index,queue.length,`Evaluando ${index+1}–${Math.min(index+items.length,queue.length)} de ${queue.length}…`);

   let response;
   try{
    response=await batchCall(session,items);
   }catch(error){
    if(error.name==="AbortError"){
     status="partial";
     break;
    }
    response={
     results:items.map(x=>({
      ok:false,
      id:x.test.id,
      competency:x.test.competency,
      error:error.message||"Error de lote"
     }))
    };
   }

   for(let j=0;j<items.length;j++){
    const normalized=normalizeAttempt(items[j],response.results?.[j]);
    results.push(normalized);
    if(normalized.model&&!model)model=normalized.model;
   }

   setProgress(results.length,queue.length,`${results.length} de ${queue.length} intentos completados`);
  }

  const summary=summarize(results);
  const meta={tests:tests.length,repetitions,model};
  lastRun={summary,results,meta};
  render(summary,results,meta);
  await saveRun(summary,results,meta,status);
  await loadHistory();
  $("calMessage").textContent=status==="completed"?"Calibración completada y guardada.":"Calibración parcial guardada.";
 }catch(error){
  console.error(error);
  $("calMessage").textContent=error.message||"No se pudo ejecutar la calibración.";
 }finally{
  running=false;
  controller=null;
  $("calRun").disabled=false;
  $("calCancel").disabled=true;
 }
}

async function init(){
 try{
  const session=await adminSession();
  $("calAdmin").textContent=session.user.email||"Administrador";
  $("calLoading").hidden=true;
  $("calApp").hidden=false;
  $("bankCount").textContent=bank.tests.length;
  updateCount();
  await loadHistory();
 }catch(error){
  $("calLoading").innerHTML=`<div><b>Acceso restringido</b><span>${esc(error.message)}</span><a href="admin.html">Ir a Administración</a></div>`;
 }
}

["calScope","calCompetency","calLevel","calRepeats"].forEach(id=>$(id).onchange=updateCount);
$("calRun").onclick=run;
$("calCancel").onclick=()=>{running=false;controller?.abort()};
$("calCsv").onclick=()=>lastRun&&downloadCsv(lastRun.results);
$("calRefreshHistory").onclick=loadHistory;
init();
})();