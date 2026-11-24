export function solveBeam({length,load,eModulus,inertiaMillion,elements}) {
  const n = elements;
  const h = length/n;
  const E = eModulus*1e9;
  const I = inertiaMillion*1e-6;
  const EI = E*I;
  const w = load*1000;
  const dof=(n+1)*2;
  const K=Array.from({length:dof},()=>Array(dof).fill(0));
  const ke=[
    [12,-6*h,-12,-6*h],
    [-6*h,4*h*h,6*h,-2*h*h],
    [-12,6*h,12,6*h],
    [-6*h,-2*h*h,6*h,4*h*h]
  ].map(row=>row.map(v=>EI/(h*h*h)*v));
  for(let e=0;e<n;e++){
    const map=[2*e,2*e+1,2*e+2,2*e+3];
    for(let i=0;i<4;i++)for(let j=0;j<4;j++)K[map[i]][map[j]]+=ke[i][j];
  }
  const F=Array(dof).fill(0);
  for(let e=0;e<n;e++){
    const fe=[w*h/2,w*h*h/12,w*h/2,-w*h*h/12];
    for(let i=0;i<4;i++)F[[2*e,2*e+1,2*e+2,2*e+3][i]]+=fe[i];
  }
  const free=[];
  for(let i=1;i<dof;i++){
    if(i!==2*n) free.push(i);
  }
  const a=gaussianSolve(free.map(i=>free.map(j=>K[i][j])),free.map(i=>F[i]));
  const u=Array(dof).fill(0);
  free.forEach((d,i)=>u[d]=a[i]);

  const points=[],moment=[],shear=[];
  for(let i=0;i<=n;i++){
    const x=i*h;
    const deflectionM = w*x*(x*x*x-2*length*x*x+length*length*length)/(24*EI);
    points.push({x,deflection:deflectionM*1000,rotation:u[2*i+1]});
  }
  for(let i=0;i<=n;i++){
    const x=i*h;
    moment.push(w*x*(length-x)/2);
    shear.push(w*(length/2-x));
  }
  const maxDeflection=Math.max(...points.map(p=>Math.abs(p.deflection)));
  return {
    length,load,EI,points,moment,shear,maxDeflection,
    maxMoment:Math.max(...moment.map(Math.abs)),
    maxShear:Math.max(...shear.map(Math.abs))/1000
  };
}

export function gaussianSolve(A,b){
  const n=b.length;
  const aug=A.map((row,i)=>[...row,b[i]]);
  for(let col=0;col<n;col++){
    let pivot=col;
    for(let r=col+1;r<n;r++)if(Math.abs(aug[r][col])>Math.abs(aug[pivot][col]))pivot=r;
    [aug[col],aug[pivot]]=[aug[pivot],aug[col]];
    const p=aug[col][col];
    if(Math.abs(p)<1e-12)continue;
    for(let j=col;j<=n;j++)aug[col][j]/=p;
    for(let r=0;r<n;r++)if(r!==col){
      const factor=aug[r][col];
      for(let j=col;j<=n;j++)aug[r][j]-=factor*aug[col][j];
    }
  }
  return aug.map(row=>row[n]);
}

export function pointLoadResponse({ length, loadKN, loadPosition, eModulus = 200, inertiaMillion = 85, damageLocation = 0.62, damageSeverity = 0 }) {
  const E = eModulus * 1e9;
  const I = inertiaMillion * 1e-6;
  const P = loadKN * 1000;
  const a = loadPosition * length;
  const b = length - a;
  const points = [];
  const n = 80;

  for (let i = 0; i <= n; i++) {
    const x = i / n * length;
    const EI = E * I;
    let deflection;
    if (x <= a) {
      deflection = P * b * x / (6 * EI * length) *
        (length * length - b * b - x * x);
    } else {
      deflection = P * a * (length - x) / (6 * EI * length) *
        (length * length - a * a - (length - x) * (length - x));
    }

    const damageOffset = (x / length - damageLocation);
    const damageFactor = damageSeverity / 100 * Math.exp(-(damageOffset * damageOffset) / 0.0018);
    const damagedDeflection = deflection * (1 + damageFactor * 5);

    const moment = x <= a ? P * b * x / length : P * a * (length - x) / length;
    points.push({ x, deflection: -damagedDeflection * 1000, baseline: -deflection * 1000, moment });
  }

  const maxDeflection = Math.max(...points.map((point) => Math.abs(point.deflection)));
  const maxMoment = Math.max(...points.map((point) => point.moment));
  const sectionDepth = 0.30;
  const sectionModulus = I / (sectionDepth / 2);
  const peakStress = maxMoment / sectionModulus / 1e6;
  const residualStiffness = 100 - damageSeverity * 0.62;
  const anomalyMax = Math.max(...points.map((point) =>
    Math.abs(point.deflection - point.baseline)
  ));
  const confidence = damageSeverity === 0 ? 12 :
    Math.min(99, 58 + damageSeverity * 1.4 + Math.min(anomalyMax, 8) * 2);

  return { points, maxDeflection, maxMoment, peakStress, residualStiffness, confidence };
}
