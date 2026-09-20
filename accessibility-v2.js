(()=>{"use strict";
let previous="";
function improve(){
 const toast=document.getElementById("toast");if(toast){toast.setAttribute("role","status");toast.setAttribute("aria-live","polite")}
 document.querySelectorAll("button:not([type])").forEach(b=>b.type="button");
 document.querySelectorAll(".role-meter,.quiz-top i").forEach(p=>{p.setAttribute("role","progressbar");const bar=p.querySelector("i,b");if(bar){const n=parseFloat(bar.style.width)||0;p.setAttribute("aria-valuemin","0");p.setAttribute("aria-valuemax","100");p.setAttribute("aria-valuenow",String(Math.round(n)))}});
 document.querySelectorAll(".lesson-nav").forEach(n=>n.setAttribute("aria-label","Navegación entre estaciones"));
 document.querySelectorAll(".path-menu").forEach(n=>n.setAttribute("aria-label","Etapas de la ruta de competencia"));
 document.querySelectorAll(".view.active").forEach(v=>{if(v.id!==previous){previous=v.id;const h=v.querySelector("h1,h2");if(h){h.tabIndex=-1;setTimeout(()=>h.focus({preventScroll:true}),60)}}});
 document.querySelectorAll("a[target='_blank']").forEach(a=>{if(!/nueva pestaña/i.test(a.getAttribute("aria-label")||""))a.setAttribute("aria-label",`${a.textContent.trim()} (abre en una nueva pestaña)`) });
}
new MutationObserver(improve).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style"]});document.addEventListener("DOMContentLoaded",improve);
})();
