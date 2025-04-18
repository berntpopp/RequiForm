import{_ as e,p as t,a as r,i as a,l as i,z as n}from"./index.UP9BWBox.js";import{Z as o,H as s,_ as d,$ as c,a0 as g,j as l,R as p,N as m,u,a1 as f}from"./vendor-vue.MuR-ak5S.js";import{H as h,I as _,J as v}from"./vendor-vuetify-core.gPhD-pXQ.js";import"./vendor-pdf.CZcEIuwn.js";/* empty css                     */const w=e({__name:"PedigreeDrawer",setup(e,{expose:w}){const{t:b}=o();function y(){if(!t||!r||!a)return void i.error("pedigreejs libraries are not loaded.");let e=document.getElementById("pedigreejs");const o=document.getElementById("pedigree");!e&&o&&(e=document.createElement("div"),e.id="pedigreejs",o.appendChild(e));let s={targetDiv:"pedigree",btn_target:"pedigree_history",width:650,height:400,symbol_size:35,store_type:"session",diseases:[{type:"affected",colour:"#F68F35"}],labels:[],font_size:".75em",font_family:"Helvetica",font_weight:700,edit:!0,DEBUG:!1};const d=r.current(s);s.dataset=null!=d&&d.length>0?d:[{name:"father",sex:"M",top_level:!0},{name:"mother",sex:"F",top_level:!0},{name:"child",sex:"F",father:"father",mother:"mother",proband:!0,affected:!0}];try{let e=t.build(s);n.scale_to_fit(e)}catch(c){let e="";"string"==typeof c?e=c.toUpperCase():c instanceof Error&&(e=c.message),i.error("PedigreeJS initialization error: "+e,c)}}return s((()=>{y()})),w({getPedigreeDataUrl:function(){return new Promise(((e,t)=>{try{const r=document.querySelector("#pedigree svg");if(!r)return void e("");const a=(new XMLSerializer).serializeToString(r),i=document.createElement("canvas"),n=r.getAttribute("width")||450,o=r.getAttribute("height")||320;i.width=n,i.height=o;const s=i.getContext("2d"),d=new Image;d.src="data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(a))),d.onload=()=>{s.drawImage(d,0,0);const t=i.toDataURL("image/png");e(t)},d.onerror=e=>t(e)}catch(r){t(r)}}))},getPedigreeData:function(){try{const e={targetDiv:"pedigree",btn_target:"pedigree_history"},t=r.current(e);if(i.debug("[PedigreeDrawer] Raw pedigree dataset fetched from cache:",t),!t||0===t.length)return i.warn("[PedigreeDrawer] No pedigree data found in cache"),null;const a={};let n=1;t.forEach((e=>{const t=e.name||e.id||`p${n}`;a[t]||(a[t]=n++)}));const o=[];t.forEach((e=>{const t=e.name||e.id||`p${n}`,r=a[t],i="M"===e.sex?1:"F"===e.sex?2:0,s=e.father&&a[e.father]||0,d=e.mother&&a[e.mother]||0,c=e.affected?2:1;o.push([1,r,s,d,i,c])})),o.sort(((e,t)=>e[1]-t[1]));const s=[2,o];return i.debug("[PedigreeDrawer] Final compact pedigree data prepared:",s),s}catch(e){return i.error("[PedigreeDrawer] Error getting pedigree data:",e),null}},initPedigree:y}),(e,t)=>(c(),d(v,{class:"mb-4"},{default:g((()=>[l(h,null,{default:g((()=>[p(m(u(b)("pedigreeDrawer.title")),1)])),_:1}),t[1]||(t[1]=p()),l(_,null,{default:g((()=>t[0]||(t[0]=[f("div",{id:"pedigree",class:"pedigree-container"},null,-1),p(),f("div",{id:"pedigree_history"},null,-1)]))),_:1})])),_:1}))}},[["__scopeId","data-v-4bef441c"]]);export{w as default};
