/* BoxCalc3D - Ajuste de precio final. No cambia la clave de almacenamiento. */
(()=>{
'use strict';
if(typeof db==='undefined'||typeof renderList!=='function'||typeof save!=='function')return;
const money=n=>'US$'+Number(n).toFixed(2);
const oldRender=renderList;
renderList=function(){oldRender();document.querySelectorAll('[data-open]').forEach(b=>{const id=Number(b.dataset.open);const card=b.closest('.item');const actions=card?.querySelector('.actions');if(!actions||actions.querySelector('[data-adjust]'))return;const btn=document.createElement('button');btn.className='btn secondary';btn.dataset.adjust=id;btn.textContent='✏️ Ajustar precio final';btn.onclick=()=>adjust(id);actions.append(btn);const q=db.quotes.find(x=>x.id===id);if(q&&Number.isFinite(q.priceCalculatedOriginal)){const info=document.createElement('div');info.className='mini';info.style.marginTop='7px';info.textContent='Precio calculado original: '+money(q.priceCalculatedOriginal)+' · Ganancia privada: '+money(Number(q.price)-Number(q.cost||0));card.append(info)}})};
function adjust(id){const q=db.quotes.find(x=>x.id===id);if(!q)return;const paidTotal=(q.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0);const before=Number(q.price||0);const input=prompt('Precio final para '+q.client+' (US$).\nPrecio actual: '+money(before)+'\nYa abonado: '+money(paidTotal)+'\nIngresá el nuevo total:',before.toFixed(2));if(input===null)return;const parsed=String(input).trim().replace(',','.');if(!/^\d+(?:\.\d{1,2})?$/.test(parsed))return toast('Escribí un monto válido con máximo 2 decimales');const total=Math.round(Number(parsed)*100)/100;if(!Number.isFinite(total)||total<paidTotal)return toast('El precio no puede ser menor que los abonos recibidos');if(total>100000000)return toast('El monto es demasiado grande');if(total===before)return;
const originalItems=itemsOf(q).map(i=>({...i}));const oldSum=originalItems.reduce((s,i)=>s+Number(i.price||0),0);let allocated=0;const newItems=originalItems.map((item,i)=>{const cents=i===originalItems.length-1?Math.round(total*100)-allocated:Math.round(total*100*(oldSum>0?Number(item.price||0)/oldSum:1/originalItems.length));allocated+=cents;return {...item,price:cents/100}});
if(!Number.isFinite(q.priceCalculatedOriginal))q.priceCalculatedOriginal=before;
q.items=newItems;q.price=total;q.qty=newItems.reduce((s,i)=>s+Number(i.qty||0),0);q.product=newItems.map(i=>i.product).join(', ');q.store=[...new Set(newItems.map(i=>i.store))].join(' / ');
try{save()}catch(e){q.items=originalItems;q.price=before;toast('No se pudo guardar el cambio');return}
renderList();if(typeof showQuote==='function')showQuote(id);toast('Nuevo precio: '+money(total)+' · Ganancia: '+money(total-Number(q.cost||0)));
}
renderList();
})();
