// The room: the night-time warung backdrop (painted once), the pantry bins, and the live counters
// (chopping board, two pans, plating counter, serving window) with whatever is on them.
import { COOK, FONT, LAYOUT, PALETTE, STATIONS } from './config.js';
import { INGREDIENTS, dishOf } from './recipes.js';
import { drawFood, drawPlate, drawPlated } from './food.js';
import { drawCustomer } from './characters.js';

const GROUP_COLORS = { nasi: '#f08a24', mie: '#e0b020', sate: '#d9452f', teh: '#2fb5b0' };
const BIN_WIDTH = STATIONS.pantry.w / STATIONS.pantry.bins;

function text(ctx, value, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function lantern(ctx, x, y, size) {
  const glow = ctx.createRadialGradient(x, y + size * 0.5, 2, x, y + size * 0.5, size * 3.2);
  glow.addColorStop(0, 'rgba(255,170,60,0.55)');
  glow.addColorStop(1, 'rgba(255,170,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - size * 3.2, y - size * 2.5, size * 6.4, size * 6.4);
  ctx.strokeStyle = '#2a1a22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x, y);
  ctx.stroke();
  const body = ctx.createLinearGradient(x - size, y, x + size, y);
  body.addColorStop(0, '#d63a24');
  body.addColorStop(0.5, '#ff9a3c');
  body.addColorStop(1, '#d63a24');
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.55, size * 0.85, size * 0.62, 0, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,20,10,0.5)';
  ctx.lineWidth = 1.2;
  for (let rib = -2; rib <= 2; rib += 1) {
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.55, Math.abs(size * 0.85 * (rib / 2.4)), size * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#2a1a22';
  ctx.fillRect(x - size * 0.3, y - 2, size * 0.6, 5);
  ctx.fillRect(x - size * 0.3, y + size * 1.08, size * 0.6, 5);
}

function drawCat(ctx, x, y) {
  ctx.fillStyle = '#e9a24f';
  ctx.strokeStyle = '#9a5a1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, 36, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - 30, y - 6, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 41, y - 15);
  ctx.lineTo(x - 38, y - 28);
  ctx.lineTo(x - 30, y - 18);
  ctx.moveTo(x - 24, y - 17);
  ctx.lineTo(x - 19, y - 28);
  ctx.lineTo(x - 17, y - 14);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#3a2010';
  ctx.beginPath();
  ctx.moveTo(x - 36, y - 6);
  ctx.quadraticCurveTo(x - 33, y - 3, x - 30, y - 6);
  ctx.moveTo(x - 27, y - 6);
  ctx.quadraticCurveTo(x - 24, y - 3, x - 21, y - 6);
  ctx.stroke();
  ctx.strokeStyle = '#c4782e';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 34, y + 2);
  ctx.quadraticCurveTo(x + 58, y - 4, x + 50, y - 20);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('z', x - 4, y - 22);
  ctx.fillText('z', x + 6, y - 32);
}

function nameplate(ctx, label, sub, x, w, color) {
  ctx.fillStyle = '#2a1812';
  ctx.beginPath();
  ctx.roundRect(x + 6, LAYOUT.counterFront + 8, w - 12, 34, 7);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, label, x + w / 2, LAYOUT.counterFront + 25, 15, color);
  text(ctx, sub, x + w / 2, LAYOUT.counterFront + 38, 10, '#c9b79a', 'center', 'normal');
}

/** The static room, painted once into an offscreen canvas and blitted every frame. */
export function paintBackdrop(ctx) {
  const wall = ctx.createLinearGradient(0, LAYOUT.wallY - 130, 0, LAYOUT.counterTop);
  wall.addColorStop(0, '#1b1230');
  wall.addColorStop(1, '#3b2038');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, 1280, LAYOUT.counterTop + 6);
  // wooden slats on the back wall
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 1280; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, LAYOUT.wallY);
    ctx.lineTo(x, LAYOUT.counterTop);
    ctx.stroke();
  }
  // string lights and lanterns
  ctx.strokeStyle = '#1a1018';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, LAYOUT.wallY + 10);
  for (let x = 0; x <= 1280; x += 80) ctx.quadraticCurveTo(x + 40, LAYOUT.wallY + 28, x + 80, LAYOUT.wallY + 10);
  ctx.stroke();
  for (let x = 40; x < 1280; x += 80) {
    const glow = ctx.createRadialGradient(x, LAYOUT.wallY + 24, 1, x, LAYOUT.wallY + 24, 22);
    glow.addColorStop(0, 'rgba(255,220,120,0.95)');
    glow.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 22, LAYOUT.wallY + 2, 44, 44);
  }
  [[150, LAYOUT.wallY + 30, 22], [560, LAYOUT.wallY + 36, 20], [905, LAYOUT.wallY + 30, 22], [1210, LAYOUT.wallY + 34, 20]].forEach(([x, y, size]) => lantern(ctx, x, y, size));
  // hanging utensils on the wall above the stove
  ctx.strokeStyle = '#97a0ad';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(748, LAYOUT.wallY + 36);
  ctx.lineTo(898, LAYOUT.wallY + 36);
  ctx.stroke();
  [[766, 34], [796, 44], [830, 30], [866, 40]].forEach(([x, drop], index) => {
    ctx.strokeStyle = '#97a0ad';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, LAYOUT.wallY + 36);
    ctx.lineTo(x, LAYOUT.wallY + 36 + drop);
    ctx.stroke();
    ctx.fillStyle = index % 2 ? '#c9d0da' : '#7c8693';
    ctx.beginPath();
    ctx.ellipse(x, LAYOUT.wallY + 40 + drop, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // shelf of jars above the pantry
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(18, LAYOUT.counterTop - 76, 560, 6);
  for (let index = 0; index < 11; index += 1) {
    const x = 36 + index * 50;
    const colors = ['#c9731a', '#7a4a21', '#e0301f', '#58b947', '#f1d98a'];
    ctx.fillStyle = 'rgba(220,235,255,0.2)';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(x, LAYOUT.counterTop - 112, 24, 36, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(x + 2, LAYOUT.counterTop - 98, 20, 20);
  }
  // counter top
  const top = ctx.createLinearGradient(0, LAYOUT.counterTop, 0, LAYOUT.counterFront);
  top.addColorStop(0, '#9a6236');
  top.addColorStop(1, '#6f4224');
  ctx.fillStyle = top;
  ctx.fillRect(0, LAYOUT.counterTop, 1280, LAYOUT.counterFront - LAYOUT.counterTop);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1.5;
  for (let y = LAYOUT.counterTop + 18; y < LAYOUT.counterFront; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#c28851';
  ctx.fillRect(0, LAYOUT.counterTop - 2, 1280, 4);
  // counter front
  ctx.fillStyle = '#4a2a1a';
  ctx.fillRect(0, LAYOUT.counterFront, 1280, LAYOUT.floorY - LAYOUT.counterFront);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  for (const key of Object.keys(STATIONS)) {
    ctx.beginPath();
    ctx.moveTo(STATIONS[key].x - 4, LAYOUT.counterFront);
    ctx.lineTo(STATIONS[key].x - 4, LAYOUT.floorY);
    ctx.stroke();
  }
  nameplate(ctx, 'PANTRY', 'BAHAN', STATIONS.pantry.x, STATIONS.pantry.w, '#ffd27a');
  nameplate(ctx, 'CHOP', 'TALENAN', STATIONS.board.x, STATIONS.board.w, '#9be7ff');
  nameplate(ctx, 'STOVE', 'KOMPOR', STATIONS.stove.x, STATIONS.stove.w, '#ff9a5a');
  nameplate(ctx, 'PLATING', 'SAJI', STATIONS.plating.x, STATIONS.plating.w, '#ff9ad0');
  nameplate(ctx, 'SERVE', 'JENDELA', STATIONS.window.x, STATIONS.window.w, '#8dffb0');
  // floor
  const floor = ctx.createLinearGradient(0, LAYOUT.floorY, 0, LAYOUT.barY);
  floor.addColorStop(0, '#2c1d2c');
  floor.addColorStop(1, '#1a1220');
  ctx.fillStyle = floor;
  ctx.fillRect(0, LAYOUT.floorY, 1280, LAYOUT.barY - LAYOUT.floorY);
  for (let row = 0; row < 7; row += 1) {
    for (let col = -1; col < 22; col += 1) {
      if ((row + col) % 2) continue;
      ctx.fillStyle = 'rgba(255,170,90,0.045)';
      ctx.fillRect(col * 64 + (row % 2) * 0, LAYOUT.floorY + row * 31, 64, 31);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, LAYOUT.floorY, 1280, 7);
  // a woven rug down the middle of the floor, and the stall cat asleep on it
  ctx.fillStyle = '#6b1f2a';
  ctx.beginPath();
  ctx.roundRect(120, 540, 760, 86, 14);
  ctx.fill();
  ctx.strokeStyle = '#f2b24a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(242,178,74,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(132, 550, 736, 66, 9);
  ctx.stroke();
  for (let diamond = 0; diamond < 12; diamond += 1) {
    const dx = 168 + diamond * 62;
    ctx.fillStyle = diamond % 2 ? '#f2b24a' : '#2a8c86';
    ctx.beginPath();
    ctx.moveTo(dx, 583);
    ctx.lineTo(dx + 14, 570);
    ctx.lineTo(dx + 28, 583);
    ctx.lineTo(dx + 14, 596);
    ctx.closePath();
    ctx.fill();
  }
  drawCat(ctx, 1010, 600);
  // trash bin
  const bin = LAYOUT.trash;
  ctx.fillStyle = '#3d4552';
  ctx.beginPath();
  ctx.moveTo(bin.x - 26, bin.y - 36);
  ctx.lineTo(bin.x + 26, bin.y - 36);
  ctx.lineTo(bin.x + 20, bin.y + 26);
  ctx.lineTo(bin.x - 20, bin.y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a95a5';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#566070';
  ctx.fillRect(bin.x - 30, bin.y - 44, 60, 9);
  ctx.strokeStyle = '#6a7586';
  for (let stripe = -12; stripe <= 12; stripe += 8) {
    ctx.beginPath();
    ctx.moveTo(bin.x + stripe, bin.y - 28);
    ctx.lineTo(bin.x + stripe * 0.8, bin.y + 18);
    ctx.stroke();
  }
  text(ctx, 'BIN  (X)', bin.x, bin.y + 46, 12, '#9aa5b5');
}

/** The twelve pantry bins, each a crate with its ingredient; grouped by dish colour. */
export function drawPantry(ctx, focusIndex, time) {
  INGREDIENTS.forEach((entry, index) => {
    const x = STATIONS.pantry.x + index * BIN_WIDTH;
    const cx = x + BIN_WIDTH / 2;
    const focused = focusIndex === index;
    const lift = focused ? -4 : 0;
    const group = GROUP_COLORS[entry.dish];
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 4, LAYOUT.counterTop + 78, BIN_WIDTH - 8, 6);
    ctx.fillStyle = focused ? '#e0b070' : '#b98550';
    ctx.strokeStyle = '#4a2a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 3, LAYOUT.counterTop + 20 + lift, BIN_WIDTH - 6, 64, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7a4a2a';
    ctx.fillRect(x + 6, LAYOUT.counterTop + 50 + lift, BIN_WIDTH - 12, 4);
    ctx.fillStyle = group;
    ctx.fillRect(x + 3, LAYOUT.counterTop + 20 + lift, BIN_WIDTH - 6, 6);
    drawRawSprite(ctx, entry.id, cx, LAYOUT.counterTop + 36 + lift + (focused ? Math.sin(time * 8) * 1.5 : 0));
    text(ctx, entry.name, cx, LAYOUT.counterTop + 74 + lift, 11, '#2a1408');
  });
  // dish group captions along the front
  const labels = [['NASI GORENG', 0, '#f08a24'], ['MIE GORENG', 3, '#e0b020'], ['SATE AYAM', 6, '#ff6a4a'], ['ES TEH MANIS', 9, '#2fb5b0']];
  for (const [label, first, color] of labels) {
    const x = STATIONS.pantry.x + first * BIN_WIDTH + BIN_WIDTH * 1.5;
    ctx.fillStyle = color;
    ctx.fillRect(STATIONS.pantry.x + first * BIN_WIDTH + 6, LAYOUT.counterFront - 4, BIN_WIDTH * 3 - 12, 3);
    text(ctx, label, x, LAYOUT.counterFront + 56, 10, color, 'center', 'bold');
  }
}

function drawRawSprite(ctx, ing, x, y) {
  drawFood(ctx, ing, { chopped: false, cooked: false, burnt: false }, x, y, 0.62);
}

function drawBoard(ctx, world, time, focused) {
  const state = world.state;
  const board = STATIONS.board;
  const cx = board.x + board.w / 2;
  const cy = LAYOUT.counterTop + 46;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 34, 54, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  const wood = ctx.createLinearGradient(cx - 52, cy - 30, cx + 52, cy + 30);
  wood.addColorStop(0, '#e2b678');
  wood.addColorStop(1, '#c08a4a');
  ctx.fillStyle = wood;
  ctx.strokeStyle = focused ? '#ffe27a' : '#6a4220';
  ctx.lineWidth = focused ? 3 : 2;
  ctx.beginPath();
  ctx.roundRect(cx - 52, cy - 28, 104, 62, 10);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,70,30,0.35)';
  ctx.lineWidth = 1.4;
  for (let line = -36; line <= 36; line += 12) {
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy + line * 0.5);
    ctx.lineTo(cx + 48, cy + line * 0.5 + 4);
    ctx.stroke();
  }
  if (state.board.item) {
    const item = state.board.item;
    const jitter = state.board.hit > 0 ? Math.sin(time * 90) * 2 : 0;
    drawFood(ctx, item.ing, item, cx + jitter, cy + 6, 1.55);
    if (!item.chopped) {
      // cut marks accumulate with each chop
      ctx.strokeStyle = '#fff7e6';
      ctx.lineWidth = 2.2;
      for (let cut = 0; cut < state.board.chops; cut += 1) {
        ctx.beginPath();
        ctx.moveTo(cx - 22 + cut * 20, cy - 20);
        ctx.lineTo(cx - 14 + cut * 20, cy + 28);
        ctx.stroke();
      }
    }
    for (let pip = 0; pip < COOK.chopsNeeded; pip += 1) {
      ctx.beginPath();
      ctx.arc(cx - 14 + pip * 14, cy + 44, 4.4, 0, Math.PI * 2);
      ctx.fillStyle = pip < state.board.chops ? '#ffe27a' : 'rgba(0,0,0,0.4)';
      ctx.fill();
    }
  }
  // the cleaver thumps down on each chop
  const swing = state.board.hit > 0 ? state.board.hit / 0.16 : 0;
  ctx.save();
  ctx.translate(cx + 44, cy - 6);
  ctx.rotate(-0.5 - swing * 0.55);
  ctx.fillStyle = '#c9d0da';
  ctx.strokeStyle = '#5a6270';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-4, -34, 26, 36, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a3320';
  ctx.fillRect(-1, 2, 8, 22);
  ctx.restore();
}

function drawPan(ctx, burner, x, y, time, focused) {
  const cooking = burner.state === 'cooking';
  const active = burner.state !== 'idle';
  if (cooking || burner.state === 'done') {
    const flame = ctx.createRadialGradient(x, y + 24, 2, x, y + 24, 44);
    flame.addColorStop(0, 'rgba(255,210,80,0.9)');
    flame.addColorStop(0.5, 'rgba(255,110,30,0.45)');
    flame.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = flame;
    ctx.fillRect(x - 46, y - 20, 92, 90);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 30, 40, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // wok
  ctx.fillStyle = '#23262e';
  ctx.strokeStyle = focused ? '#ffe27a' : '#5a6270';
  ctx.lineWidth = focused ? 3 : 2;
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 42, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a3f4a';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 34, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1a12';
  ctx.fillRect(x + 36, y + 6, 24, 6);
  if (burner.item) {
    const wobble = cooking ? Math.sin(time * 26) * 1.2 : 0;
    drawFood(ctx, burner.item.ing, burner.item, x, y + wobble, 1.0);
  }
  if (cooking) {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(x, y - 40, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ffc233';
    ctx.beginPath();
    ctx.arc(x, y - 40, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * burner.progress);
    ctx.stroke();
  } else if (burner.state === 'done') {
    const danger = burner.waited > COOK.warnAfter;
    const pulse = 0.5 + 0.5 * Math.sin(time * (danger ? 22 : 8));
    ctx.fillStyle = danger ? `rgba(255,74,61,${0.55 + pulse * 0.4})` : 'rgba(75,211,107,0.95)';
    ctx.beginPath();
    ctx.arc(x, y - 40, 15 + (danger ? pulse * 3 : 0), 0, Math.PI * 2);
    ctx.fill();
    text(ctx, danger ? '!' : '✓', x, y - 33, 20, '#10240f');
  } else if (burner.state === 'burnt') {
    text(ctx, 'BURNT', x, y - 36, 13, '#ff6a5a');
  }
  if (!active) text(ctx, 'free', x, y - 38, 11, 'rgba(255,255,255,0.35)', 'center', 'normal');
}

function drawStove(ctx, world, time, focus) {
  const stove = STATIONS.stove;
  ctx.fillStyle = '#2d313a';
  ctx.strokeStyle = '#555d6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(stove.x, LAYOUT.counterTop + 8, stove.w, 76, 8);
  ctx.fill();
  ctx.stroke();
  world.state.burners.forEach((burner, index) => {
    drawPan(ctx, burner, world.burnerX(index), LAYOUT.counterTop + 42, time, focus && focus.station === 'stove' && focus.index === index);
  });
}

/** Slots hint at the three places a recipe fills; the real plate contents drop into them. */
function drawPlatingCounter(ctx, world, time, focused) {
  const state = world.state;
  const plating = STATIONS.plating;
  const cx = plating.x + plating.w / 2;
  const cy = LAYOUT.counterTop + 52;
  const plate = state.plate;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.roundRect(plating.x + 2, LAYOUT.counterTop + 6, plating.w - 4, 80, 10);
  ctx.fill();
  if (focused) {
    ctx.strokeStyle = '#ffe27a';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  drawPlate(ctx, cx, cy, 78, 32);
  if (plate.ids.length === 0) {
    ctx.strokeStyle = 'rgba(80,60,40,0.35)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    [[-30, 0], [0, -4], [30, 0]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 13, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    text(ctx, '1  2  3', cx, cy + 5, 13, 'rgba(80,60,40,0.4)');
  }
  drawPlated(ctx, cx, cy, 1.0, plate.placed, state.time);
  if (plate.dish) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 7);
    ctx.strokeStyle = `rgba(255,226,122,${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 82, 36, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (plate.wrong) {
    ctx.strokeStyle = PALETTE.bad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 82, 36, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // one-click bin button
  const button = LAYOUT.plateButton;
  const live = plate.ids.length > 0 || plate.wrong;
  ctx.fillStyle = live ? '#d9382b' : 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(button.x, button.y, button.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = live ? '#fff' : 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(button.x - 5, button.y - 5);
  ctx.lineTo(button.x + 5, button.y + 5);
  ctx.moveTo(button.x + 5, button.y - 5);
  ctx.lineTo(button.x - 5, button.y + 5);
  ctx.stroke();
  // what is on the plate, as a caption
  let caption = '';
  if (plate.dish) caption = `${dishOf(plate.dish).local.toUpperCase()} READY`;
  else if (plate.wrong) caption = 'WRONG COMBO';
  else if (plate.ids.length > 0) caption = `${plate.ids.length} / 3`;
  if (caption) {
    const color = plate.dish ? '#ffe27a' : plate.wrong ? '#ff6a5a' : '#fff7e6';
    ctx.font = `bold 13px ${FONT}`;
    const width = ctx.measureText(caption).width + 18;
    ctx.fillStyle = 'rgba(21,14,28,0.82)';
    ctx.beginPath();
    ctx.roundRect(cx - width / 2, LAYOUT.counterTop + 82, width, 22, 11);
    ctx.fill();
    text(ctx, caption, cx, LAYOUT.counterTop + 98, 13, color);
  }
}

function drawWindow(ctx, world, time, focused) {
  const state = world.state;
  const win = STATIONS.window;
  const cx = win.x + win.w / 2;
  // opening onto the street, with the next customer waiting
  ctx.fillStyle = '#0f0b1c';
  ctx.beginPath();
  ctx.roundRect(win.x + 4, LAYOUT.wallY + 62, win.w - 8, LAYOUT.counterTop - LAYOUT.wallY - 52, 6);
  ctx.fill();
  const street = ctx.createLinearGradient(0, LAYOUT.wallY + 62, 0, LAYOUT.counterTop);
  street.addColorStop(0, '#26204a');
  street.addColorStop(1, '#5a3a5a');
  ctx.fillStyle = street;
  ctx.fillRect(win.x + 8, LAYOUT.wallY + 66, win.w - 16, LAYOUT.counterTop - LAYOUT.wallY - 60);
  const waiting = state.orders[0];
  ctx.save();
  ctx.beginPath();
  ctx.rect(win.x + 8, LAYOUT.wallY + 66, win.w - 16, LAYOUT.counterTop - LAYOUT.wallY - 60);
  ctx.clip();
  drawCustomer(ctx, cx - 14, LAYOUT.counterTop - 6, state.window.age < 3 ? 1 : 0, time, waiting ? waiting.dish : null);
  ctx.restore();
  // striped awning
  for (let stripe = 0; stripe < 8; stripe += 1) {
    ctx.fillStyle = stripe % 2 ? '#fff4d6' : '#d93a2b';
    ctx.beginPath();
    const x0 = win.x + 2 + stripe * ((win.w - 4) / 8);
    ctx.moveTo(x0, LAYOUT.wallY + 40);
    ctx.lineTo(x0 + (win.w - 4) / 8, LAYOUT.wallY + 40);
    ctx.lineTo(x0 + (win.w - 4) / 8, LAYOUT.wallY + 62);
    ctx.arc(x0 + (win.w - 4) / 16, LAYOUT.wallY + 62, (win.w - 4) / 16, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  }
  if (focused) {
    ctx.strokeStyle = '#ffe27a';
    ctx.lineWidth = 3;
    ctx.strokeRect(win.x + 3, LAYOUT.wallY + 40, win.w - 6, LAYOUT.counterFront - LAYOUT.wallY - 40);
  }
  // the pass: a served plate rests here for a few seconds
  ctx.fillStyle = '#c28851';
  ctx.fillRect(win.x, LAYOUT.counterTop, win.w, 10);
  if (state.window.dish && state.window.age < COOK.serveLinger) {
    const age = state.window.age;
    const fade = age > COOK.serveLinger - 1.5 ? (COOK.serveLinger - age) / 1.5 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);
    const slide = Math.min(1, age / 0.25);
    const dish = dishOf(state.window.dish);
    ctx.translate(0, (1 - slide) * -20);
    const wy = LAYOUT.counterTop + 46;
    drawPlate(ctx, cx, wy, 70, 28);
    const dishScale = 0.9;
    drawDishOnPlate(ctx, dish, cx, wy - 2, dishScale);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, fade));
    ctx.fillStyle = 'rgba(21,14,28,0.82)';
    ctx.beginPath();
    ctx.roundRect(cx - 52, LAYOUT.counterTop + 82, 104, 22, 11);
    ctx.fill();
    text(ctx, 'SERVED  ✓', cx, LAYOUT.counterTop + 98, 13, '#8dffb0');
    ctx.restore();
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, LAYOUT.counterTop + 46, 62, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'plate here', cx, LAYOUT.counterTop + 50, 12, 'rgba(255,255,255,0.4)', 'center', 'normal');
  }
}

function drawDishOnPlate(ctx, dish, x, y, s) {
  const placed = dish.components.map((ing) => ({ ing, at: -10 }));
  drawPlated(ctx, x, y, s, placed, 0);
}

/** Every live station, in left-to-right order. */
export function drawStations(ctx, world, time) {
  const focus = world.state.focus;
  drawPantry(ctx, focus && focus.station === 'pantry' ? focus.index : -1, time);
  drawBoard(ctx, world, time, focus && focus.station === 'board');
  drawStove(ctx, world, time, focus);
  drawPlatingCounter(ctx, world, time, focus && focus.station === 'plating');
  drawWindow(ctx, world, time, focus && focus.station === 'window');
}

