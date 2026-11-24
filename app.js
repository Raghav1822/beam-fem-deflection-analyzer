import {solveBeam} from './beam.js';

const defCanvas=document.getElementById('deflectionCanvas'),momCanvas=document.getElementById('momentCanvas');
const defCtx=defCanvas.getContext('2d'),momCtx=momCanvas.getContext('2d');
const ui={
 length:document.getElementById('length'),load:document.getElementById('load'),modulus:document.getElementById('modulus'),inertia:document.getElementById('inertia'),elements:document.getElementById('elements'),
 lengthOut:document.getElementById('lengthOut'),loadOut:document.getElementById('loadOut'),modulusOut:document.getElementById('modulusOut'),inertiaOut:document.getElementById('inertiaOut'),elementsOut:document.getElementById('elementsOut'),
 deflection:document.getElementById('deflection'),moment:document.getElementById('moment'),shear:document.getElementById('shear'),rotation:document.getElementById('rotation')
};
function values(){return{length:Number(ui.length.value),load:Number(ui.load.value),eModulus:Number(ui.modulus.value),inertiaMillion:Number(ui.inertia.value),elements:Number(ui.elements.value)}}
function sync(){ui.lengthOut.textContent=ui.length.value;ui.loadOut.textContent=ui.load.value;ui.modulusOut.textContent=ui.modulus.value;ui.inertiaOut.textContent=ui.inertia.value;ui.elementsOut.textContent=ui.elements.value;update()}

function setup(ctx){
 ctx.clearRect(0,0,860,250);ctx.fillStyle='#091522';ctx.fillRect(0,0,860,250);ctx.strokeStyle='rgba(210,232,245,.22)';ctx.beginPath();ctx.moveTo(70,125);ctx.lineTo(820,125);ctx.stroke();
 ctx.fillStyle='#9aabba';ctx.font='12px Inter, sans-serif';ctx.fillText('x',820,145);
}
function drawDeflection(result){
 const ctx=defCtx;setup(ctx);const left=70,right=820,center=125;
 ctx.strokeStyle='#65d6e8';ctx.lineWidth=4;ctx.beginPath();
 const max=Math.max(...result.points.map(p=>Math.abs(p.deflection)),0.001);
 result.points.forEach((p,i)=>{const x=left+p.x/result.length*(right-left),y=center-p.deflection/max*95;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
 ctx.stroke();ctx.fillStyle='#edf5ff';ctx.font='13px Inter, sans-serif';ctx.fillText('Deflection (mm)',70,22);
 ctx.fillStyle='#ffb45b';ctx.beginPath();ctx.moveTo(left,center);ctx.lineTo(left-10,center+12);ctx.lineTo(left+10,center+12);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.moveTo(right,center);ctx.lineTo(right-10,center+12);ctx.lineTo(right+10,center+12);ctx.closePath();ctx.fill();
}
function drawMoment(result){
 const ctx=momCtx;setup(ctx);const left=70,right=820,base=125,max=Math.max(...result.moment.map(Math.abs),1);
 ctx.strokeStyle='#ffb45b';ctx.lineWidth=4;ctx.beginPath();
 result.moment.forEach((m,i)=>{const x=left+i/(result.moment.length-1)*(right-left),y=base-m/max*95;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
 ctx.stroke();ctx.fillStyle='#edf5ff';ctx.font='13px Inter, sans-serif';ctx.fillText('Bending moment (kN·m)',70,22);
}
function update(){
 const result=solveBeam(values());
 ui.deflection.textContent=`${result.maxDeflection.toFixed(2)} mm`;
 ui.moment.textContent=`${(result.maxMoment/1000).toFixed(1)} kN·m`;
 ui.shear.textContent=`${result.maxShear.toFixed(1)} kN`;
 ui.rotation.textContent=`${(result.points[0].rotation*1000).toFixed(2)} mrad`;
 drawDeflection(result);drawMoment(result);
}
[ui.length,ui.load,ui.modulus,ui.inertia,ui.elements].forEach(el=>el.addEventListener('input',sync));sync();
