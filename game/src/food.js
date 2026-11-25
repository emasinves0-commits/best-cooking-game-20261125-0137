// All the food art, drawn with canvas paths: every ingredient in each state it can be in, the plate
// it is assembled on, and the glass for the tea. Coordinates are centred on (x, y) and scaled by s
// (s = 1 is a sprite about 44 px across).

function blob(ctx, x, y, rx, ry, fill, stroke, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function pseudo(index) {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function rice(ctx, st) {
  const cooked = st.cooked;
  blob(ctx, 0, 6, 21, 11, 'rgba(0,0,0,0.18)');
  ctx.beginPath();
  ctx.moveTo(-21, 6);
  ctx.quadraticCurveTo(-18, -17, 0, -17);
  ctx.quadraticCurveTo(18, -17, 21, 6);
  ctx.quadraticCurveTo(0, 15, -21, 6);
  ctx.fillStyle = cooked ? '#e39a3a' : '#f6efdb';
  ctx.fill();
  ctx.strokeStyle = cooked ? '#a8601e' : '#cfc3a6';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  for (let index = 0; index < 22; index += 1) {
    const angle = index * 2.399;
    const radius = Math.sqrt(index / 22) * 15;
    const gx = Math.cos(angle) * radius;
    const gy = -5 + Math.sin(angle) * radius * 0.55;
    blob(ctx, gx, gy, 3.1, 1.5, cooked ? (index % 3 === 0 ? '#8b4a1b' : '#f1b25a') : '#ffffff', null, angle);
  }
  if (cooked) {
    for (let index = 0; index < 5; index += 1) blob(ctx, -10 + index * 5.5, -8 + (index % 2) * 7, 1.8, 1.2, '#7fc243');
  }
}

function egg(ctx, st) {
  if (!st.cooked) {
    blob(ctx, 0, 1, 12, 15, '#fbf0dd', '#d9c7a3');
    blob(ctx, -4, -5, 3, 5, 'rgba(255,255,255,0.8)');
    return;
  }
  ctx.beginPath();
  [[-9, -3, 11], [8, -4, 10], [-3, 7, 11], [10, 6, 8], [-12, 7, 7]].forEach(([cx, cy, r]) => ctx.arc(cx + 0.01, cy, r, 0, Math.PI * 2));
  ctx.fillStyle = '#fffdf6';
  ctx.fill();
  ctx.strokeStyle = '#e1b968';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  blob(ctx, -1, 0, 8, 8, '#ffb219', '#e58d00');
  blob(ctx, -4, -3, 2.6, 2, 'rgba(255,255,255,0.75)');
}

function chilli(ctx, st) {
  if (!st.chopped) {
    ctx.beginPath();
    ctx.moveTo(-17, -4);
    ctx.quadraticCurveTo(0, -18, 15, 4);
    ctx.quadraticCurveTo(0, -6, -15, 4);
    ctx.closePath();
    ctx.fillStyle = '#d92c1d';
    ctx.fill();
    ctx.strokeStyle = '#8d160e';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-17, -4);
    ctx.lineTo(-23, -9);
    ctx.strokeStyle = '#3f8f2c';
    ctx.lineWidth = 4;
    ctx.stroke();
    blob(ctx, -6, -6, 5, 1.6, 'rgba(255,255,255,0.45)', null, -0.2);
    return;
  }
  [[-12, 3], [0, -5], [11, 2], [-2, 8], [13, 12]].forEach(([cx, cy], index) => {
    blob(ctx, cx, cy, 6.5, 6.5, '#d92c1d', '#8d160e');
    blob(ctx, cx, cy, 3.6, 3.6, '#ff735a');
    blob(ctx, cx - 1 + (index % 2), cy, 1.1, 1.1, '#ffeaa8');
  });
}

function noodle(ctx, st) {
  const cooked = st.cooked;
  blob(ctx, 0, 7, 22, 10, 'rgba(0,0,0,0.18)');
  const colour = cooked ? '#b5651f' : '#f3dc8e';
  const edge = cooked ? '#6f3a0e' : '#c9ac55';
  for (let row = 0; row < 6; row += 1) {
    ctx.beginPath();
    const y = -12 + row * 5;
    ctx.moveTo(-18 + (row % 2) * 3, y);
    for (let seg = 0; seg < 4; seg += 1) ctx.quadraticCurveTo(-10 + seg * 10, y + (seg % 2 ? -7 : 7), -3 + seg * 10, y);
    ctx.strokeStyle = edge;
    ctx.lineWidth = 5.2;
    ctx.stroke();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 3.4;
    ctx.stroke();
  }
  if (cooked) blob(ctx, -6, -9, 7, 2, 'rgba(255,230,160,0.5)', null, -0.2);
}

function chickenCubes(ctx, cooked, cubeSize) {
  const spots = [[-11, 0], [2, -8], [12, 4], [-2, 9], [-16, 10], [16, -8]];
  spots.forEach(([cx, cy], index) => {
    const half = cubeSize * (0.85 + (index % 3) * 0.1);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((index - 2) * 0.35);
    ctx.fillStyle = cooked ? '#c78232' : '#f3b3a4';
    ctx.strokeStyle = cooked ? '#7a4511' : '#c97d70';
    ctx.lineWidth = 1.3;
    ctx.fillRect(-half, -half, half * 2, half * 2);
    ctx.strokeRect(-half, -half, half * 2, half * 2);
    ctx.fillStyle = cooked ? '#e6a850' : '#ffd2c7';
    ctx.fillRect(-half + 1.5, -half + 1.5, half, half * 0.6);
    ctx.restore();
  });
}

function chicken(ctx, st) {
  if (!st.chopped) {
    blob(ctx, 2, 3, 17, 12, '#f0a99b', '#c4766a', -0.3);
    blob(ctx, -5, -2, 8, 4, 'rgba(255,255,255,0.35)', null, -0.3);
    ctx.fillStyle = '#fff7e6';
    ctx.fillRect(-23, 6, 10, 5);
    blob(ctx, -23, 8.5, 3.5, 3.5, '#fff7e6');
    return;
  }
  chickenCubes(ctx, st.cooked, 5);
}

function greens(ctx, st) {
  if (!st.chopped) {
    [[-10, 0, -0.5], [0, -2, 0], [10, 0, 0.5]].forEach(([cx, cy, rot]) => {
      ctx.save();
      ctx.translate(cx, cy + 4);
      ctx.rotate(rot);
      blob(ctx, 0, -6, 8, 15, '#4aa53d', '#2b7226');
      blob(ctx, 0, 4, 3, 9, '#e8f5c8');
      ctx.restore();
    });
    return;
  }
  for (let index = 0; index < 16; index += 1) {
    const gx = (pseudo(index) - 0.5) * 36;
    const gy = (pseudo(index + 40) - 0.5) * 20;
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(pseudo(index + 9) * 3);
    ctx.fillStyle = index % 4 === 0 ? '#e8f5c8' : '#55b640';
    ctx.strokeStyle = '#2b7226';
    ctx.lineWidth = 0.8;
    ctx.fillRect(-5, -2.2, 10, 4.4);
    ctx.strokeRect(-5, -2.2, 10, 4.4);
    ctx.restore();
  }
}

function skewer(ctx, st) {
  const cooked = st.cooked;
  const burnt = st.burnt;
  ctx.save();
  ctx.rotate(-0.38);
  for (let stick = 0; stick < 2; stick += 1) {
    const oy = stick * 12 - 6;
    ctx.beginPath();
    ctx.moveTo(-26, oy);
    ctx.lineTo(26, oy);
    ctx.strokeStyle = '#c9a063';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    for (let piece = 0; piece < 3; piece += 1) {
      const cx = -9 + piece * 11;
      blob(ctx, cx, oy, 6.2, 6.8, burnt ? '#2a2420' : cooked ? '#9a5528' : '#f1a8a0', burnt ? '#000' : cooked ? '#5a2e10' : '#c4766a');
      if (cooked) {
        blob(ctx, cx - 1, oy - 2, 2.6, 1.5, 'rgba(255,214,150,0.65)');
        ctx.fillStyle = '#3a1c0a';
        ctx.fillRect(cx - 4, oy + 1.5, 8, 1.4);
      }
    }
  }
  ctx.restore();
}

function peanut(ctx, st) {
  if (!st.chopped) {
    [[-10, -3, 0.5], [6, -6, -0.4], [-2, 8, 0.2], [12, 6, 1]].forEach(([cx, cy, rot]) => {
      blob(ctx, cx - 2.6, cy, 5.5, 4.4, '#d8a35e', '#8e6428', rot);
      blob(ctx, cx + 2.6, cy, 5.5, 4.4, '#d8a35e', '#8e6428', rot);
    });
    return;
  }
  blob(ctx, 0, 3, 20, 11, '#f4efe2', '#c9bfa7');
  blob(ctx, 0, 1, 16, 8, '#7a4a21', '#4c2b10');
  blob(ctx, -4, -2, 7, 2.4, 'rgba(255,196,128,0.55)', null, -0.1);
  for (let index = 0; index < 9; index += 1) blob(ctx, (pseudo(index) - 0.5) * 26, (pseudo(index + 5) - 0.5) * 10, 1.9, 1.4, '#d7a15b');
}

function ricecake(ctx, st) {
  if (!st.chopped) {
    ctx.save();
    ctx.rotate(-0.3);
    ctx.fillStyle = '#5ea23a';
    ctx.strokeStyle = '#356c1f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-22, -9, 44, 18, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#a5d770';
    ctx.lineWidth = 1.2;
    for (let line = -14; line <= 14; line += 7) {
      ctx.beginPath();
      ctx.moveTo(line, -9);
      ctx.lineTo(line + 3, 9);
      ctx.stroke();
    }
    ctx.fillStyle = '#d8b46a';
    ctx.fillRect(-10, -10, 3, 20);
    ctx.fillRect(9, -10, 3, 20);
    ctx.restore();
    return;
  }
  [[-12, 4], [0, -4], [12, 5]].forEach(([cx, cy], index) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((index - 1) * 0.25);
    ctx.fillStyle = '#fbf2d3';
    ctx.strokeStyle = '#d6c391';
    ctx.lineWidth = 1.3;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.fillStyle = '#84bd5a';
    ctx.fillRect(-7, -7, 14, 2.6);
    ctx.restore();
  });
}

function tea(ctx, st) {
  if (!st.cooked) {
    for (let index = 0; index < 6; index += 1) {
      blob(ctx, (pseudo(index) - 0.5) * 30, (pseudo(index + 7) - 0.5) * 20, 6, 2.6, index % 2 ? '#3f6b2a' : '#5f8d3a', '#27441a', pseudo(index + 3) * 3);
    }
    ctx.fillStyle = '#efe3c6';
    ctx.strokeStyle = '#b7a67e';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-9, -2, 18, 14);
    ctx.strokeRect(-9, -2, 18, 14);
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, -12);
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(-12, -14);
  ctx.lineTo(12, -14);
  ctx.lineTo(10, 14);
  ctx.lineTo(-10, 14);
  ctx.closePath();
  ctx.fillStyle = '#c9731a';
  ctx.fill();
  ctx.strokeStyle = '#6d3a0a';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-9, -11, 3, 22);
  ctx.strokeStyle = '#6d3a0a';
  ctx.beginPath();
  ctx.arc(14, 0, 7, -1.2, 1.2);
  ctx.stroke();
}

function sugar(ctx) {
  [[-10, 4], [3, 6], [-3, -6], [12, -2]].forEach(([cx, cy], index) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((index - 1.5) * 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#c7cdd6';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.fillStyle = '#eef2f8';
    ctx.fillRect(-7, 2, 14, 5);
    ctx.restore();
  });
  blob(ctx, 15, -11, 1.8, 1.8, '#fff7a0');
  blob(ctx, -16, -9, 1.4, 1.4, '#fff7a0');
}

function ice(ctx, st) {
  if (!st.chopped) {
    ctx.save();
    ctx.rotate(-0.15);
    ctx.fillStyle = 'rgba(150,226,255,0.85)';
    ctx.strokeStyle = '#4fb4d8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-16, -15, 32, 30, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillRect(-12, -11, 6, 20);
    ctx.restore();
    return;
  }
  [[-12, 4, 0.3], [0, -6, -0.2], [11, 5, 0.6], [-2, 8, 0.1]].forEach(([cx, cy, rot]) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(160,230,255,0.9)';
    ctx.strokeStyle = '#4fb4d8';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-7, 5);
    ctx.lineTo(-4, -7);
    ctx.lineTo(7, -4);
    ctx.lineTo(5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-3, -4, 3, 5);
    ctx.restore();
  });
}

function burntLump(ctx) {
  ctx.beginPath();
  ctx.moveTo(-18, 8);
  ctx.quadraticCurveTo(-22, -10, -6, -14);
  ctx.quadraticCurveTo(10, -18, 18, -4);
  ctx.quadraticCurveTo(22, 10, 0, 12);
  ctx.closePath();
  ctx.fillStyle = '#26211f';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  blob(ctx, -4, -4, 5, 2, 'rgba(255,255,255,0.12)');
  ctx.strokeStyle = '#ff5a3a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 8);
  ctx.moveTo(6, 0);
  ctx.lineTo(-6, 8);
  ctx.stroke();
}

const PAINTERS = { rice, egg, chilli, noodle, chicken, greens, skewer, peanut, ricecake, tea, sugar, ice };

/** Draws one ingredient in the state `st` ({ chopped, cooked, burnt }) at (x, y), scaled by s. */
export function drawFood(ctx, ing, st, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (st.burnt) burntLump(ctx);
  else PAINTERS[ing](ctx, st);
  ctx.restore();
}

/** The state an ingredient has when it is ready for the plate (used by icons on tickets and bins). */
export const FINISHED = {
  rice: { cooked: true }, egg: { cooked: true }, chilli: { chopped: true },
  noodle: { cooked: true }, chicken: { chopped: true, cooked: true }, greens: { chopped: true },
  skewer: { cooked: true }, peanut: { chopped: true }, ricecake: { chopped: true },
  tea: { cooked: true }, sugar: {}, ice: { chopped: true },
};

export function drawFinished(ctx, ing, x, y, s = 1) {
  drawFood(ctx, ing, FINISHED[ing], x, y, s);
}

/** A plate seen from the front-above: shadow, rim, well. */
export function drawPlate(ctx, x, y, rx, ry) {
  blob(ctx, x, y + ry * 0.35, rx * 1.02, ry * 0.95, 'rgba(0,0,0,0.3)');
  blob(ctx, x, y, rx, ry, '#fbf6ea', '#b8ab90');
  blob(ctx, x, y + 1, rx * 0.8, ry * 0.76, '#ffffff', '#e0d6c0');
  ctx.strokeStyle = '#d9703d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.9, ry * 0.86, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** Where each ingredient sits on a plate (offsets from the plate centre, scale, layer). */
const SPOTS = {
  rice: { x: -14, y: 4, s: 1.35, z: 0 }, egg: { x: -12, y: -8, s: 1.05, z: 2 }, chilli: { x: 28, y: 6, s: 0.9, z: 1 },
  noodle: { x: -2, y: 4, s: 1.5, z: 0 }, chicken: { x: 12, y: -8, s: 1.0, z: 2 }, greens: { x: -26, y: 8, s: 0.9, z: 1 },
  skewer: { x: 2, y: -2, s: 1.35, z: 1 }, peanut: { x: -30, y: 8, s: 0.95, z: 0 }, ricecake: { x: 28, y: 8, s: 0.95, z: 0 },
  // tea things only land on a plate in a wrong combo; on their own they fill a glass instead
  tea: { x: -26, y: 6, s: 0.85, z: 1 }, sugar: { x: 28, y: 6, s: 0.85, z: 1 }, ice: { x: 0, y: -6, s: 0.85, z: 2 },
};

const GLASS_INGREDIENTS = ['tea', 'sugar', 'ice'];

export function usesGlass(ids) {
  return ids.length > 0 && ids.every((id) => GLASS_INGREDIENTS.includes(id));
}

/** A tall glass of tea that fills as tea, ice and sugar arrive. */
export function drawGlass(ctx, x, y, s, ids, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  blob(ctx, 0, 14, 22, 7, 'rgba(0,0,0,0.25)');
  ctx.beginPath();
  ctx.moveTo(-18, -34);
  ctx.lineTo(18, -34);
  ctx.lineTo(14, 14);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fillStyle = 'rgba(210,240,255,0.35)';
  ctx.fill();
  if (ids.includes('tea')) {
    ctx.beginPath();
    ctx.moveTo(-16.5, -20);
    ctx.lineTo(16.5, -20);
    ctx.lineTo(14, 13);
    ctx.lineTo(-14, 13);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, -20, 0, 14);
    gradient.addColorStop(0, '#d98a22');
    gradient.addColorStop(1, '#a8570f');
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  if (ids.includes('ice')) {
    [[-8, -20, 0.2], [6, -18, -0.3], [-1, -6, 0.5]].forEach(([cx, cy, rot]) => {
      ctx.save();
      ctx.translate(cx, cy + Math.sin(time * 2 + cx) * 0.8);
      ctx.rotate(rot);
      ctx.fillStyle = 'rgba(200,240,255,0.9)';
      ctx.strokeStyle = '#7fcde6';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.restore();
    });
  }
  if (ids.includes('sugar')) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#c7cdd6';
    ctx.fillRect(20, 8, 12, 12);
    ctx.strokeRect(20, 8, 12, 12);
    ctx.fillRect(28, -2, 11, 11);
    ctx.strokeRect(28, -2, 11, 11);
    blob(ctx, 0, -14, 13, 2.4, 'rgba(255,255,255,0.4)');
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-18, -34);
  ctx.lineTo(-14, 14);
  ctx.lineTo(14, 14);
  ctx.lineTo(18, -34);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(-14, -30, 3, 38);
  if (ids.includes('tea')) {
    ctx.strokeStyle = '#ff6a8a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, -40);
    ctx.lineTo(4, -8);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * The contents of a plate: `placed` is [{ ing, at }] in placement order. Each piece drops in from
 * above and settles, which is the dish visibly assembling.
 */
export function drawPlated(ctx, x, y, s, placed, time) {
  if (usesGlass(placed.map((entry) => entry.ing))) {
    const ids = placed.map((entry) => entry.ing);
    const last = placed[placed.length - 1];
    const drop = last ? Math.max(0, 1 - (time - last.at) / 0.22) : 0;
    drawGlass(ctx, x, y - 8 - drop * 18, s * 1.25, ids, time);
    return;
  }
  const layers = placed.map((entry) => ({ entry, spot: SPOTS[entry.ing] })).sort((a, b) => a.spot.z - b.spot.z);
  for (const { entry, spot } of layers) {
    const age = Math.max(0, time - entry.at);
    const drop = Math.max(0, 1 - age / 0.22);
    const item = entry.item ?? { ...FINISHED[entry.ing] };
    drawFood(ctx, entry.ing, item, x + spot.x * s, y + spot.y * s - drop * 46 * s, spot.s * s * (1 + drop * 0.25));
  }
}

/** The finished dish for a recipe, for the menu and the serving window. */
export function drawDish(ctx, dish, x, y, s, time = 0) {
  const placed = dish.components.map((ing) => ({ ing, at: -10 }));
  if (dish.id === 'teh') {
    drawPlate(ctx, x, y + 14 * s, 44 * s, 20 * s);
    drawPlated(ctx, x, y + 10 * s, s * 0.8, placed, time);
    return;
  }
  drawPlate(ctx, x, y, 50 * s, 26 * s);
  drawPlated(ctx, x, y - 2 * s, s * 1.0, placed, time);
}
