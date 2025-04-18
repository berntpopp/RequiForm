import{Z as a,b as e,c as l,o as t,_ as s,$ as u,a0 as o,j as d,R as r,N as p,u as n,a1 as i,a2 as c}from"./vendor-vue.MuR-ak5S.js";import{_ as v,g as m,l as f,d as b}from"./index.UP9BWBox.js";import{H as M,I as _,O as x,K as D,e as y,x as g,M as V,d as k,J as h,N as j}from"./vendor-vuetify-core.gPhD-pXQ.js";import"./vendor-pdf.CZcEIuwn.js";/* empty css                     */const P={class:"mb-4"},C={class:"mb-1"},w={class:"text-body-2"},B=v({__name:"PasteDataModal",props:{modelValue:{type:Boolean,required:!0}},emits:["update:modelValue","close","import"],setup(v,{emit:B}){const{t:N}=a(),S=v,q=B,A=e(""),I=e(null),J=e(""),O=e(!1),R=l((()=>m())),U=l({get:()=>S.modelValue,set:a=>q("update:modelValue",a)});function $(){A.value.trim()?(f.debug("PasteDataModal: Parsing data:",A.value.substring(0,100)+"..."),I.value=b(A.value),f.debug("PasteDataModal: Parse result:",I.value),J.value=I.value.success?"":I.value.error||N("pasteDataModal.alerts.parseError")):J.value=N("pasteDataModal.validation.pasteRequired")}function E(){if(I.value&&I.value.success){const a=JSON.stringify(I.value.data);f.info("PasteDataModal: Sending data for import:",I.value.data),q("import",a),U.value=!1}}function H(){A.value=R.value,I.value=null,J.value=""}return t((()=>S.modelValue),(a=>{!0===a&&(A.value="",I.value=null,J.value="",O.value=!1)})),(a,e)=>(u(),s(j,{modelValue:U.value,"onUpdate:modelValue":e[3]||(e[3]=a=>U.value=a),"max-width":"700",persistent:""},{default:o((()=>[d(h,null,{default:o((()=>[d(M,{class:"headline"},{default:o((()=>[r(p(n(N)("pasteDataModal.title")),1)])),_:1}),e[14]||(e[14]=r()),d(_,null,{default:o((()=>[i("p",P,p(n(N)("pasteDataModal.instructions")),1),e[6]||(e[6]=r()),d(x,{modelValue:A.value,"onUpdate:modelValue":e[0]||(e[0]=a=>A.value=a),outlined:"",rows:"10",label:n(N)("pasteDataModal.labels.pasteArea"),placeholder:n(N)("pasteDataModal.placeholders.pasteArea"),"error-messages":J.value,"auto-grow":"",class:"mb-3"},null,8,["modelValue","label","placeholder","error-messages"]),e[7]||(e[7]=r()),O.value?(u(),s(D,{key:0,type:"info",text:"",class:"mb-3"},{default:o((()=>[i("p",C,[i("strong",null,p(n(N)("pasteDataModal.example.title")),1)]),e[4]||(e[4]=r()),i("pre",w,p(R.value),1),e[5]||(e[5]=r()),d(y,{"x-small":"",text:"",color:"primary",onClick:H,class:"mt-2"},{default:o((()=>[r(p(n(N)("pasteDataModal.example.useButton")),1)])),_:1})])),_:1})):c("",!0),e[8]||(e[8]=r()),I.value&&!I.value.success?(u(),s(D,{key:1,type:"error",text:"",class:"mb-3"},{default:o((()=>[r(p(I.value.error),1)])),_:1})):c("",!0),e[9]||(e[9]=r()),I.value&&I.value.success?(u(),s(D,{key:2,type:"success",text:"",class:"mb-3"},{default:o((()=>[r(p(n(N)("pasteDataModal.alerts.parseSuccess")),1)])),_:1})):c("",!0)])),_:1}),e[15]||(e[15]=r()),d(g),e[16]||(e[16]=r()),d(V,null,{default:o((()=>[d(y,{color:"primary",text:"",onClick:e[1]||(e[1]=a=>O.value=!O.value)},{default:o((()=>[r(p(O.value?n(N)("pasteDataModal.example.hideButton"):n(N)("pasteDataModal.example.showButton")),1)])),_:1}),e[10]||(e[10]=r()),d(k),e[11]||(e[11]=r()),d(y,{text:"",onClick:e[2]||(e[2]=e=>a.$emit("close"))},{default:o((()=>[r(p(n(N)("pasteDataModal.buttons.cancel")),1)])),_:1}),e[12]||(e[12]=r()),d(y,{color:"primary",text:"",onClick:$,disabled:!A.value.trim()},{default:o((()=>[r(p(n(N)("pasteDataModal.buttons.parse")),1)])),_:1},8,["disabled"]),e[13]||(e[13]=r()),d(y,{color:"success",text:"",onClick:E,disabled:!I.value||!I.value.success},{default:o((()=>[r(p(n(N)("pasteDataModal.buttons.import")),1)])),_:1},8,["disabled"])])),_:1})])),_:1})])),_:1},8,["modelValue"]))}},[["__scopeId","data-v-02ff2b53"]]);export{B as default};
