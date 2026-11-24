import { pointLoadResponse } from './beam.js';

const canvas = document.getElementById('twinCanvas');
const ctx = canvas.getContext('2d');
const ui = {
  vehicle: document.getElementById('vehicle'),
  speed: document.getElementById('speed'),
  damage: document.getElementById('damage'),
  damageLocation: document.getElementById('damageLocation'),
  vehicleOut: document.getElementById('vehicleOut'),
  speedOut: document.getElementById('speedOut'),
  damageOut: document.getElementById('damageOut'),
  damageLocationOut: document.getElementById('damageLocationOut'),
  deflection: document.getElementById('deflection'),
  stress: document.getElementById('stress'),
  stiffness: document.getElementById('stiffness'),
  confidence: document.getElementById('confidence'),
  vehiclePosition: document.getElementById('vehiclePosition'),
  healthValue: document.getElementById('healthValue'),
  playBtn: document.getElementById('playBtn'),
  resetBtn: document.getElementById('resetBtn'),
  systemStatus: document.getElementById('systemStatus')
};

let scanPosition = 0;
let running = true;
let lastTime = performance.now();
let history = [];

function readValues() {
  return {
    length: 6,
    loadKN: Number(ui.vehicle.value),
    loadPosition: scanPosition,
    eModulus: 200,
    inertiaMillion: 85,
    damageLocation: Number(ui.damageLocation.value) / 100,
    damageSeverity: Number(ui.damage.value)
  };
}

function syncLabels() {
  ui.vehicleOut.textContent = ui.vehicle.value;
  ui.speedOut.textContent = Number(ui.speed.value).toFixed(1);
  ui.damageOut.textContent = ui.damage.value;
  ui.damageLocationOut.textContent = ui.damageLocation.value;
}

function drawBeam(result, values) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#091522';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const left = 95;
  const right = 765;
  const beamY = 245;
  const span = right - left;

  ctx.strokeStyle = 'rgba(210,232,245,.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = left + i / 10 * span;
    ctx.beginPath(); ctx.moveTo(x, 55); ctx.lineTo(x, 350); ctx.stroke();
  }

  const damageX = left + values.damageLocation * span;
  ctx.fillStyle = 'rgba(223,90,103,.18)';
  ctx.fillRect(damageX - 42, 220, 84, 52);
  ctx.strokeStyle = '#df5a67';
  ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(damageX, 210); ctx.lineTo(damageX, 330); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#60798a';
  ctx.fillRect(left - 10, beamY - 13, span + 20, 26);
  ctx.strokeStyle = '#a6bdd0';
  ctx.lineWidth = 2;
  ctx.strokeRect(left - 10, beamY - 13, span + 20, 26);

  const maxDeflection = Math.max(...result.points.map((point) => Math.abs(point.deflection)), 1);
  ctx.beginPath();
  result.points.forEach((point, i) => {
    const x = left + point.x / values.length * span;
    const y = beamY - point.deflection / maxDeflection * 110;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#65d6e8';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.beginPath();
  result.points.forEach((point, i) => {
    const x = left + point.x / values.length * span;
    const y = beamY - point.baseline / maxDeflection * 110;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = 'rgba(151,171,187,.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 7]);
  ctx.stroke();
  ctx.setLineDash([]);

  const sensorCount = 9;
  for (let i = 0; i < sensorCount; i++) {
    const fraction = i / (sensorCount - 1);
    const point = result.points[Math.round(fraction * (result.points.length - 1))];
    const x = left + fraction * span;
    const y = beamY - point.deflection / maxDeflection * 110;
    ctx.beginPath(); ctx.arc(x, y - 14, 5, 0, Math.PI * 2);
    ctx.fillStyle = i === 4 ? '#ffb45b' : '#91d83b'; ctx.fill();
  }

  const loadX = left + scanPosition * span;
  ctx.fillStyle = '#ffad66';
  ctx.fillRect(loadX - 24, beamY - 68, 48, 28);
  ctx.fillStyle = '#edf5ff';
  ctx.beginPath(); ctx.moveTo(loadX - 16, beamY - 40); ctx.lineTo(loadX - 9, beamY - 28); ctx.lineTo(loadX - 23, beamY - 28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(loadX + 16, beamY - 40); ctx.lineTo(loadX + 23, beamY - 28); ctx.lineTo(loadX + 9, beamY - 28); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#edf5ff';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${values.loadKN.toFixed(0)} kN proof load`, loadX, beamY - 82);

  ctx.fillStyle = '#ffb45b';
  ctx.beginPath(); ctx.moveTo(left, beamY + 13); ctx.lineTo(left - 18, beamY + 38); ctx.lineTo(left + 18, beamY + 38); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(right, beamY + 13); ctx.lineTo(right - 18, beamY + 38); ctx.lineTo(right + 18, beamY + 38); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#98aabd';
  ctx.textAlign = 'left';
  ctx.fillText('0 m', left - 8, 390);
  ctx.textAlign = 'right';
  ctx.fillText('6 m', right + 8, 390);

  for (let i = 0; i < history.length - 1; i++) {
    const x1 = left + history[i].position * span;
    const x2 = left + history[i + 1].position * span;
    ctx.strokeStyle = 'rgba(223,90,103,.45)';
    ctx.beginPath(); ctx.moveTo(x1, 365); ctx.lineTo(x2, 365 - history[i].peak / 4); ctx.stroke();
  }
}

function update(now) {
  if (running) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    scanPosition += dt * 0.07 * Number(ui.speed.value);
    if (scanPosition >= 1) scanPosition = 1;
  }
  lastTime = now;

  const values = readValues();
  const result = pointLoadResponse(values);
  drawBeam(result, values);

  ui.deflection.textContent = `${result.maxDeflection.toFixed(2)} mm`;
  ui.stress.textContent = `${result.peakStress.toFixed(1)} MPa`;
  ui.stiffness.textContent = `${result.residualStiffness.toFixed(1)}%`;
  ui.confidence.textContent = `${result.confidence.toFixed(0)}%`;
  ui.vehiclePosition.textContent = `Vehicle at ${(scanPosition * 100).toFixed(0)}% span`;
  ui.healthValue.textContent = `${(100 - Number(ui.damage.value) * 0.62).toFixed(1)}%`;

  if (history.length === 0 || scanPosition - history.at(-1).position > 0.025 || running === false) {
    history.push({ position: scanPosition, peak: result.maxDeflection });
    if (history.length > 40) history.shift();
  }

  if (scanPosition >= 1 && running) {
    running = false;
    ui.playBtn.textContent = 'Replay scan';
  }
  requestAnimationFrame(update);
}

[ui.vehicle, ui.speed, ui.damage, ui.damageLocation].forEach((input) => input.addEventListener('input', syncLabels));
ui.playBtn.addEventListener('click', () => {
  if (scanPosition >= 1) {
    scanPosition = 0;
    history = [];
  }
  running = !running;
  ui.playBtn.textContent = running ? 'Pause scan' : 'Resume scan';
  ui.systemStatus.textContent = running ? 'SIMULATION LIVE' : 'SCAN PAUSED';
});
ui.resetBtn.addEventListener('click', () => {
  scanPosition = 0;
  history = [];
  running = true;
  ui.playBtn.textContent = 'Pause scan';
  ui.systemStatus.textContent = 'SIMULATION LIVE';
});
syncLabels();
requestAnimationFrame(update);
