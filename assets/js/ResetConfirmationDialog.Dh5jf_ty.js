import{Z as e,_ as a,$ as o,a0 as t,j as l,R as n,N as s,u,a1 as i}from"./vendor-vue.MuR-ak5S.js";import{H as r,I as d,M as m,d as f,e as c,J as p,N as _}from"./vendor-vuetify-core.gPhD-pXQ.js";const C={__name:"ResetConfirmationDialog",props:{modelValue:Boolean},emits:["update:modelValue","cancel","confirm"],setup(C,{emit:V}){const{t:v}=e(),g=V;function x(){g("cancel"),g("update:modelValue",!1)}function D(){g("confirm"),g("update:modelValue",!1)}return(e,V)=>(o(),a(_,{"model-value":C.modelValue,"max-width":"500","onUpdate:modelValue":V[0]||(V[0]=a=>e.$emit("update:modelValue",a))},{default:t((()=>[l(p,null,{default:t((()=>[l(r,{class:"headline"},{default:t((()=>[n(s(u(v)("resetConfirmationDialog.title")),1)])),_:1}),V[3]||(V[3]=n()),l(d,null,{default:t((()=>[i("p",null,s(u(v)("resetConfirmationDialog.confirmationText")),1)])),_:1}),V[4]||(V[4]=n()),l(m,null,{default:t((()=>[l(f),V[1]||(V[1]=n()),l(c,{text:"",onClick:x},{default:t((()=>[n(s(u(v)("resetConfirmationDialog.buttons.cancel")),1)])),_:1}),V[2]||(V[2]=n()),l(c,{color:"error",text:"",onClick:D},{default:t((()=>[n(s(u(v)("resetConfirmationDialog.buttons.reset")),1)])),_:1})])),_:1})])),_:1})])),_:1},8,["model-value"]))}};export{C as default};
