(()=>{"use strict";
const URL="https://lfdmbkzghnwvsapxypvt.supabase.co";
const KEY="sb_publishable_bRnkA6PA8-v073nrw9zxiQ_8rVGiOn1";
const TOKEN="desarrolla-ranking-token";
const cache=new Map();
function mapCase(c,shape){
 const choices=Array.isArray(c.guided_choices)?c.guided_choices:[];
 const meta={caseId:c.id,goal:c.goal||"",limit:c.limit_text||"",difficulty:Number(c.difficulty||2),criticalRules:c.critical_rules||"",source:c.source||"custom"};
 if(shape==="object")return{id:c.legacy_key||c.id,caseId:c.id,icon:c.icon||"🎭",name:c.actor_name,case:c.case_name,context:c.context,goal:c.goal||"",limit:c.limit_text||"",voice:c.opening,choices,difficulty:meta.difficulty,criticalRules:meta.criticalRules,source:meta.source};
 return[c.legacy_key||c.id,c.icon||"🎭",c.actor_name,c.case_name,c.context,c.opening,choices,meta];
}
async function fetchCases(competency){
 const token=sessionStorage.getItem(TOKEN)||"";
 if(!token)throw Error("session_missing");
 const key=competency+":"+token;
 const hit=cache.get(key);if(hit&&Date.now()-hit.at<120000)return hit.rows;
 const r=await fetch(URL+"/rest/v1/rpc/desarrolla_roleplay_cases",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify({p_token:token,p_competency:competency})});
 const d=await r.json().catch(()=>({}));if(!r.ok||!d?.ok||!Array.isArray(d.cases))throw Error(d?.message||"case_catalog_unavailable");
 cache.set(key,{at:Date.now(),rows:d.cases});return d.cases;
}
async function load(competency,fallback,shape="array"){
 try{const rows=await fetchCases(competency);return rows.length?rows.map(c=>mapCase(c,shape)):fallback}
 catch(e){console.warn("RoleplayCaseLibrary fallback",competency,e);return fallback}
}
function clear(){cache.clear()}
window.RoleplayCaseLibrary={load,clear};
})();