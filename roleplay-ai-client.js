(()=>{"use strict";
const API="https://lfdmbkzghnwvsapxypvt.supabase.co/functions/v1/desarrolla-roleplay-ai";
const SESSION="desarrolla-ranking-token";
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const qualityPoint=ev=>ev?.quality==="strong"?2:ev?.quality==="risk"?-1:0;
function historyOf(cfg){return(cfg.getTrace?.()||[]).filter(x=>x?.ai).slice(-5).map(x=>({usuario:String(x.choice||"").slice(0,900),contraparte:String(x.reaction||"").slice(0,900),score:Number(x.evaluation?.total||0),status:String(x.evaluation?.conversation?.status||""),critical:Boolean(x.evaluation?.riesgo_critico)}))}
function scenario(actor){return{actor:actor.name,caseName:actor.caseName,context:actor.context,opening:actor.opening,goal:actor.goal||"",limit:actor.limit||""}}
function rubric(ev){const dims=Array.isArray(ev?.dimensions)?ev.dimensions:[];return dims.map(d=>`<span><b>${esc(d.label)}</b> ${esc(d.score)}/${esc(d.max)}</span>`).join("")}
function attach(cfg){
 const root=document.getElementById(cfg.root),guided=document.getElementById(cfg.guidedButton);if(!root||!guided||root.querySelector(".ai-pilot-callout"))return;
 guided.classList.remove("primary");guided.classList.add("secondary");guided.textContent=cfg.guidedLabel||"Opciones guiadas";
 const box=document.createElement("div");box.className="ai-pilot-callout";box.innerHTML='<b>Simulación con IA</b><span>Responde con tus propias palabras. La contraparte reaccionará a lo que escribas y una rúbrica específica de esta competencia evaluará tu trayectoria.</span>';
 let buttons=guided.parentElement?.classList.contains("route-buttons")?guided.parentElement:null;
 if(buttons)buttons.parentNode.insertBefore(box,buttons);else{const parent=guided.parentNode;parent.insertBefore(box,guided);buttons=document.createElement("div");buttons.className="route-buttons";parent.insertBefore(buttons,guided);buttons.appendChild(guided)}
 const ai=document.createElement("button");ai.type="button";ai.className="primary";ai.textContent="Responder libremente con IA →";buttons.appendChild(ai);
 ai.onclick=()=>start(cfg);
}
function start(cfg){cfg.reset?.();cfg.onStart?.();const state={turn:1,prompt:cfg.actor.opening,busy:false,ended:false};render(cfg,state,null)}
function render(cfg,state,feed){
 const root=document.getElementById(cfg.root);if(!root)return;const ev=feed?.evaluation,ended=Boolean(ev?.conversation?.should_end),cls=ev?.quality==="strong"?"good":ev?.quality==="risk"?"risk":"mid";
 root.innerHTML=`<div class="route-shell"><article class="route-card ai-role-card"><p class="kicker teal">${esc(cfg.actor.icon||"")} ${esc(cfg.actor.name)} · Conversación libre adaptativa · intervención ${state.turn}</p><h2>${esc(cfg.actor.caseName)}</h2><div class="role-meter"><i style="width:${Math.min(100,state.turn/6*100)}%"></i></div>${RoleplayBranching.meter(cfg.getBranch())}<div class="counterpart"><b>${esc(cfg.actor.name)}:</b><br>${esc(state.prompt)}</div>${feed?`<div class="feedback ${cls}"><b>${ev.quality==="strong"?"Intervención sólida":ev.quality==="risk"?"Intervención de riesgo":"Intervención parcial"}</b><p><strong>Fortaleza:</strong> ${esc(ev.fortaleza||"")}</p><p><strong>Para mejorar:</strong> ${esc(ev.oportunidad||"")}</p>${ev.riesgo_critico?'<p><strong>Alerta crítica:</strong> la respuesta comprometió un criterio crítico de la competencia.</p>':""}<div class="ai-rubric-mini">${rubric(ev)}</div></div><div class="route-buttons"><button class="secondary" id="rpAiRestart">Reiniciar</button><button class="primary" id="rpAiContinue">${ended?"Ver resultado":"Responder a esta reacción →"}</button></div>`:`<div class="ai-response-box"><label for="rpAiAnswer"><b>¿Qué responderías?</b></label><textarea id="rpAiAnswer" rows="5" maxlength="2500" placeholder="Escribe exactamente lo que dirías o harías en esta situación…"></textarea><p class="ai-help">No busques palabras clave. Expresa tu criterio profesional. La conversación puede durar entre 3 y 6 intervenciones según cómo evolucione el caso.</p><p id="rpAiError" class="message" role="alert"></p><div class="route-buttons"><button class="secondary" id="rpAiGuided">Usar opciones guiadas</button><button class="primary" id="rpAiSend">Evaluar mi respuesta y continuar →</button></div></div>`}</article></div>`;
 if(feed){document.getElementById("rpAiRestart").onclick=()=>cfg.restart();document.getElementById("rpAiContinue").onclick=()=>{if(ended)cfg.finish();else{state.turn=Math.min(6,state.turn+1);render(cfg,state,null)}}}
 else{document.getElementById("rpAiGuided").onclick=()=>cfg.guided();document.getElementById("rpAiSend").onclick=()=>submit(cfg,state);document.getElementById("rpAiAnswer")?.focus()}
}
async function submit(cfg,state){
 if(state.busy)return;const answer=String(document.getElementById("rpAiAnswer")?.value||"").trim(),err=document.getElementById("rpAiError"),token=sessionStorage.getItem(SESSION)||"";
 if(answer.length<12){if(err)err.textContent="Desarrolla un poco más tu respuesta para poder evaluarla.";return}
 if(!token){if(err)err.textContent="Tu sesión de integrante no está disponible. Sal e ingresa nuevamente.";return}
 state.busy=true;const send=document.getElementById("rpAiSend");if(send){send.disabled=true;send.textContent="Analizando tu intervención…"}if(err)err.textContent="";
 try{
  const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,competency:cfg.competency,turn:state.turn,respuesta:answer,historial:historyOf(cfg),scenario:scenario(cfg.actor)})});
  const d=await r.json().catch(()=>({}));if(!r.ok||!d?.ok)throw Error(d?.message||"La evaluación con IA no está disponible.");
  const ev=d.evaluation,p=qualityPoint(ev),feedback=[ev.fortaleza,ev.oportunidad].filter(Boolean).join(" ");
  cfg.pushTrace({choice:answer,points:p,feedback,ai:true,evaluation:ev,reaction:ev.reaccion,model:d.model,status:ev?.conversation?.status||"continue"});
  cfg.onAssessment?.(ev,p);
  cfg.setBranch(RoleplayBranching.applyAssessment(cfg.getBranch(),ev,{choice:answer,feedback,domain:cfg.competency,ai:true}));
  state.prompt=ev.reaccion||"Necesito que concretemos qué haría ahora y cómo verificaremos el resultado.";state.ended=Boolean(ev?.conversation?.should_end);
  render(cfg,state,{evaluation:ev});
 }catch(e){if(err)err.textContent=String(e?.message||e||"No se pudo evaluar la respuesta.");if(send){send.disabled=false;send.textContent="Reintentar evaluación →"}}finally{state.busy=false}
}
const style=document.createElement("style");style.textContent=`.ai-pilot-callout{display:grid;gap:4px;margin:16px 0;padding:14px 16px;border:1px solid #b9dadd;border-radius:14px;background:#f2fbfb}.ai-pilot-callout b{color:#007b85}.ai-pilot-callout span{color:#475569;font-size:.9rem}.ai-response-box{margin-top:18px}.ai-response-box label{display:block;margin-bottom:8px;color:#00205b}.ai-response-box textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:130px;border:1px solid #cbd5e1;border-radius:14px;padding:13px 14px;font:inherit;line-height:1.5;color:#1e293b;background:#fff}.ai-response-box textarea:focus{outline:3px solid rgba(0,123,133,.15);border-color:#007b85}.ai-help{font-size:.82rem;color:#64748b;margin:7px 0 0}.ai-role-card .feedback p{margin:7px 0}.ai-role-card .role-meter:after{content:"Trayectoria adaptativa · mínimo 3, máximo 6";display:block;margin-top:7px;font-size:.72rem;color:#64748b}.ai-role-card .route-buttons{flex-wrap:wrap}.ai-rubric-mini{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.ai-rubric-mini span{font-size:.74rem;background:#fff;border:1px solid #dce5ed;border-radius:999px;padding:4px 8px;color:#475569}.rp-evaluation .ai-rubric-mini{display:none!important}@media(max-width:620px){.ai-role-card .route-buttons>button{width:100%}}`;document.head.appendChild(style);
window.RoleplayAI={attach};
})();