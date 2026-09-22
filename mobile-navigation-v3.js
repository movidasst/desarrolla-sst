(()=>{"use strict";
const app=document.getElementById("app"),modalSelector="#expertModal,#paymentModal,#certificateModal,#adminPreviewModal:not([hidden])";let current="",fromHistory=false,scheduled=false;
function visible(){return app&&!app.hidden}
function active(){return document.querySelector("main>.view.active")?.id||"home"}
function sync(id){document.querySelectorAll("header nav [data-view]").forEach(x=>{const on=x.dataset.view===id;x.classList.toggle("active",on);if(on)x.setAttribute("aria-current","page");else x.removeAttribute("aria-current")})}
function url(id){const u=new URL(location.href);u.hash=id;return u.pathname+u.search+u.hash}
function record(){scheduled=false;if(!visible()||fromHistory)return;const id=active();sync(id);if(!id||id===current)return;if(!current){history.replaceState({desarrolla:true,view:id},"",url(id))}else history.pushState({desarrolla:true,view:id},"",url(id));current=id}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(record)}
function restore(id){const target=document.getElementById(id);if(!target?.classList.contains("view"))return;fromHistory=true;document.querySelectorAll("main>.view").forEach(x=>x.classList.toggle("active",x===target));current=id;sync(id);scrollTo({top:0,behavior:"auto"});setTimeout(()=>{fromHistory=false},0)}
function modalState(){const open=Boolean(document.querySelector(modalSelector));document.body.classList.toggle("desarrolla-modal-open",open)}
new MutationObserver(mutations=>{if(mutations.some(m=>m.type==="attributes"&&(m.target===app||m.target.classList?.contains("view"))))schedule();modalState()}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["class","hidden"]});
addEventListener("popstate",event=>{if(visible())restore(event.state?.view||location.hash.slice(1)||"home")});
addEventListener("keydown",event=>{if(event.key!=="Escape")return;document.querySelector("#expertClose,[data-payment-close],[data-certificate-close],#adminPreviewClose")?.click()});
document.querySelector("header nav")?.setAttribute("aria-label","Navegación principal");modalState();schedule();
})();
