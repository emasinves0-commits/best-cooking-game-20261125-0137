// Everything drawn over the kitchen: the neon sign, the big shift timer, the score, the order
// board (tickets with recipe icons and urgency bars), the bottom bar (hands, combo meter, keys),
// the prompt above the focused counter, floating score pops and the rush-hour banner.
import { FONT, LAYOUT, PALETTE, SCORE, SHIFT } from './config.js';
import { dishOf, dishesContaining, ingredientOf } from './recipes.js';
import { drawFinished, drawFood, drawDish } from './food.js';
import { heldLabel } from './characters.js';
import { stepHint } from './recipes.js';

export function text(ctx, value, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

export function glowText(ctx, value, x, y, size, color, glow, align = 'center') {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 18;
  text(ctx, value, x, y, size, color, align);
  ctx.shadowBlur = 8;
  text(ctx, value, x, y, size, color, align);
  ctx.restore();
}

function panel(ctx, x, y, w, h, fill, stroke, radius = 12, lineWidth = 2) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function urgencyColor(fraction) {
  if (fraction > 0.5) return PALETTE.good;
  if (fraction > 0.25) return PALETTE.warn;
  return PALETTE.bad;
}

function formatClock(seconds) {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function drawSign(ctx, time) {
  panel(ctx, 14, 6, 372, 48, '#1a0f24', '#ff4fa3', 10, 3);
  const flicker = 0.9 + 0.1 * Math.sin(time * 9) * Math.sin(time * 2.3);
  ctx.save();
  ctx.globalAlpha = flicker;
  glowText(ctx, 'KILAT', 108, 42, 34, '#ffd0ea', '#ff4fa3');
  glowText(ctx, 'KITCHEN', 270, 42, 34, '#c8fbff', '#4df3ff');
  ctx.restore();
  // lightning bolt between the words
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath();
  ctx.moveTo(184, 10);
  ctx.lineTo(166, 33);
  ctx.lineTo(178, 33);
  ctx.lineTo(170, 50);
  ctx.lineTo(196, 26);
  ctx.lineTo(183, 26);
  ctx.closePath();
  ctx.fill();
}

function drawShiftTimer(ctx, state, time) {
  const urgent = state.rush;
  const x = 440;
  const w = 400;
  const pulse = urgent ? 0.5 + 0.5 * Math.sin(time * 8) : 0;
  panel(ctx, x, 4, w, 54, urgent ? `rgba(${90 + pulse * 70},16,20,0.96)` : 'rgba(20,12,30,0.92)', urgent ? '#ff4a3d' : '#ffb347', 14, urgent ? 4 : 3);
  const fraction = state.remaining / SHIFT.seconds;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(x + 12, 46, w - 24, 8, 4);
  ctx.fill();
  ctx.fillStyle = urgent ? '#ff4a3d' : '#ffb347';
  ctx.beginPath();
  ctx.roundRect(x + 12, 46, Math.max(8, (w - 24) * fraction), 8, 4);
  ctx.fill();
  const lowSeconds = state.remaining <= 10;
  const scale = lowSeconds ? 1 + 0.12 * Math.abs(Math.sin(time * Math.PI)) : 1;
  ctx.save();
  ctx.translate(x + w / 2, 40);
  ctx.scale(scale, scale);
  text(ctx, formatClock(state.remaining), 0, 0, 44, urgent ? '#ffd0c8' : '#fff7e6');
  ctx.restore();
  text(ctx, 'SHIFT', x + 58, 30, 15, '#c9b79a');
  if (urgent) text(ctx, 'RUSH HOUR x2', x + w - 80, 30, 17, '#ffe27a');
  else text(ctx, `${state.served} served`, x + w - 66, 30, 15, '#c9b79a');
}

function drawScore(ctx, state) {
  panel(ctx, 880, 6, 386, 48, 'rgba(20,12,30,0.92)', '#4df3ff', 12, 3);
  text(ctx, 'SCORE', 900, 26, 14, '#9be7ff', 'left');
  text(ctx, String(state.score).padStart(1, '0'), 1244, 44, 38, '#fff7e6', 'right');
  text(ctx, 'rupiah-points', 900, 44, 11, '#7e6f93', 'left', 'normal');
}

/** The small process glyphs under a recipe icon: a knife, a flame, or a tick for "as is". */
function processGlyph(ctx, kind, x, y, size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  if (kind === 'chop' || kind === 'chopcook') {
    ctx.fillStyle = '#d7dde6';
    ctx.strokeStyle = '#59616f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-9, -5);
    ctx.lineTo(0, -5);
    ctx.lineTo(0, 4);
    ctx.lineTo(-9, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6b3a1e';
    ctx.fillRect(0, -2, 7, 4);
  }
  if (kind === 'cook' || kind === 'chopcook') {
    const ox = kind === 'chopcook' ? 13 : 0;
    ctx.fillStyle = '#ff7a2a';
    ctx.beginPath();
    ctx.moveTo(ox, -8);
    ctx.quadraticCurveTo(ox + 8, -1, ox + 5, 5);
    ctx.quadraticCurveTo(ox, 8, ox - 5, 5);
    ctx.quadraticCurveTo(ox - 7, -1, ox, -8);
    ctx.fill();
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath();
    ctx.arc(ox, 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (kind === 'none') text(ctx, 'as is', 0, 4, 10, '#8a7a6a', 'center', 'normal');
  ctx.restore();
}

function drawTicket(ctx, order, index, state, time) {
  const dish = dishOf(order.dish);
  const x = LAYOUT.ticketX + index * (LAYOUT.ticketW + LAYOUT.ticketGap);
  const y = LAYOUT.boardY;
  const w = LAYOUT.ticketW;
  const h = LAYOUT.ticketH;
  const fraction = order.left / order.total;
  const color = urgencyColor(fraction);
  const intro = Math.min(1, order.age / 0.3);
  const shake = fraction < 0.18 ? Math.sin(time * 50) * 1.8 : 0;
  ctx.save();
  ctx.translate(x + w / 2 + shake, y + h / 2);
  ctx.scale(0.8 + 0.2 * intro, 0.8 + 0.2 * intro);
  ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.roundRect(4, 5, w, h, 8);
  ctx.fill();
  panel(ctx, 0, 0, w, h, PALETTE.cream, fraction < 0.25 ? PALETTE.bad : index === 0 ? '#ffc800' : '#d9c58f', 8, fraction < 0.25 || index === 0 ? 4 : 2);
  // top stripe in the dish colour, with the queue position
  ctx.fillStyle = dish.color;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, 30, [8, 8, 0, 0]);
  ctx.fill();
  panel(ctx, 8, 4, 22, 22, index === 0 ? '#ffe27a' : 'rgba(0,0,0,0.3)', null, 11);
  text(ctx, String(index + 1), 19, 21, 15, index === 0 ? '#3a2a08' : '#fff');
  text(ctx, dish.local.toUpperCase(), 40, 22, 18, '#fff', 'left');
  text(ctx, dish.name, w - 10, 21, 12, 'rgba(255,255,255,0.88)', 'right', 'normal');
  // recipe icons: each component in its finished state, with how to prepare it
  const plateIds = state.plate.ids;
  dish.components.forEach((ing, slot) => {
    const cx = 40 + slot * 58;
    panel(ctx, cx - 26, 36, 52, 54, '#fff9e8', '#eadbb2', 8, 1.5);
    drawFinished(ctx, ing, cx, 58, 0.78);
    processGlyph(ctx, ingredientOf(ing).process, cx, 80, 0.85);
    if (plateIds.includes(ing) && dishesContaining(plateIds).some((candidate) => candidate.id === dish.id)) {
      ctx.fillStyle = PALETTE.good;
      ctx.beginPath();
      ctx.arc(cx + 18, 44, 9, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '✓', cx + 18, 49, 13, '#0d2a14');
    }
  });
  dish.components.forEach((ing, line) => {
    const entry = ingredientOf(ing);
    const verb = { chop: 'chop', cook: 'cook', chopcook: 'chop+cook', none: 'as is' }[entry.process];
    text(ctx, entry.name, 188, 52 + line * 16, 11, '#5a4a2a', 'left');
    text(ctx, verb, 291, 52 + line * 16, 10, entry.process === 'none' ? '#8a7a5a' : '#c0561a', 'right');
  });
  // urgency bar
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.roundRect(10, h - 26, w - 20, 16, 8);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(10, h - 26, Math.max(10, (w - 20) * fraction), 16, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.roundRect(14, h - 24, Math.max(6, (w - 28) * fraction), 5, 3);
  ctx.fill();
  text(ctx, `${Math.ceil(order.left)}s`, w - 16, h - 13, 13, fraction > 0.5 ? '#103a1c' : '#2a0e0a', 'right');
  ctx.restore();
}

function drawBoard(ctx, state, time) {
  panel(ctx, 8, LAYOUT.boardY - 4, 1264, LAYOUT.ticketH + 10, 'rgba(26,14,34,0.88)', '#5a3a6a', 10, 2);
  for (let slot = 0; slot < 4; slot += 1) {
    const x = LAYOUT.ticketX + slot * (LAYOUT.ticketW + LAYOUT.ticketGap);
    if (slot >= state.orders.length) {
      ctx.setLineDash([8, 6]);
      panel(ctx, x, LAYOUT.boardY, LAYOUT.ticketW, LAYOUT.ticketH, 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.18)', 8, 2);
      ctx.setLineDash([]);
      text(ctx, 'waiting for the next order...', x + LAYOUT.ticketW / 2, LAYOUT.boardY + 68, 14, 'rgba(255,255,255,0.28)', 'center', 'normal');
    }
  }
  state.orders.forEach((order, index) => drawTicket(ctx, order, index, state, time));
}

function drawComboMeter(ctx, state, world) {
  const x = 440;
  const y = LAYOUT.barY + 6;
  panel(ctx, x, y, 400, 64, 'rgba(20,12,30,0.92)', state.combo > 1 ? '#7dffb0' : '#5a3a6a', 12, 3);
  text(ctx, 'COMBO', x + 14, y + 24, 14, '#9be7ff', 'left');
  const mult = world.multiplier();
  text(ctx, `x${mult.toFixed(2).replace(/0$/, '')}`, x + 14, y + 54, 30, state.combo > 1 ? '#7dffb0' : '#fff7e6', 'left');
  const pipW = 24;
  for (let pip = 0; pip < SCORE.comboCap; pip += 1) {
    const px = x + 118 + pip * (pipW + 6);
    const lit = pip < state.combo;
    ctx.fillStyle = lit ? `hsl(${100 - pip * 9},85%,${55 + (pip === state.combo - 1 ? 8 : 0)}%)` : 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(px, y + 14, pipW, 30, 5);
    ctx.fill();
  }
  text(ctx, state.combo > 0 ? `${state.combo} in a row: serve the NEXT ticket` : 'serve tickets in order to build it', x + 118, y + 58, 12, '#c9b79a', 'left', 'normal');
  text(ctx, `best ${state.bestCombo}`, x + 388, y + 24, 12, '#c9b79a', 'right', 'normal');
}

function drawHands(ctx, state) {
  const x = 14;
  const y = LAYOUT.barY + 6;
  const held = state.chef.held;
  panel(ctx, x, y, 412, 64, 'rgba(20,12,30,0.92)', held ? '#ffe27a' : '#5a3a6a', 12, 3);
  text(ctx, 'IN HAND', x + 14, y + 22, 12, '#9be7ff', 'left');
  panel(ctx, x + 12, y + 28, 36, 30, 'rgba(255,255,255,0.08)', null, 8);
  if (held) {
    if (held.kind === 'plate') drawDish(ctx, dishOf(held.dish), x + 62, y + 36, 0.5);
    else drawFood(ctx, held.item.ing, held.item, x + 62, y + 34, 0.8);
    text(ctx, heldLabel(held), x + 92, y + 28, 15, '#fff7e6', 'left');
    text(ctx, held.kind === 'plate' ? 'Walk to the SERVE window and press E' : stepHint(held.item), x + 92, y + 48, 12, '#ffe27a', 'left', 'normal');
    text(ctx, 'click here to bin', x + 396, y + 22, 11, '#8a7a9a', 'right', 'normal');
  } else {
    text(ctx, 'Empty hands: grab something from the pantry', x + 62, y + 46, 13, '#b9a9c9', 'left', 'normal');
  }
}

function drawKeys(ctx) {
  const x = 854;
  const y = LAYOUT.barY + 6;
  panel(ctx, x, y, 412, 64, 'rgba(20,12,30,0.92)', '#5a3a6a', 12, 3);
  text(ctx, 'WASD / arrows  walk      E / Space  use counter', x + 14, y + 25, 13, '#e6d9f2', 'left', 'normal');
  text(ctx, 'click a counter  go + use      X  bin in-hand', x + 14, y + 44, 13, '#e6d9f2', 'left', 'normal');
  text(ctx, 'P pause   M mute', x + 14, y + 59, 11, '#9a8aaa', 'left', 'normal');
}

function drawPrompt(ctx, world) {
  const state = world.state;
  const label = world.describeFocus();
  if (!label || !state.focus) return;
  const chef = state.chef;
  const width = 20 + label.length * 8.4;
  const x = chef.x;
  const y = chef.y + 40;
  panel(ctx, x - width / 2, y - 16, width, 28, 'rgba(21,14,28,0.88)', '#ffe27a', 14, 2);
  text(ctx, `E  ${label}`, x, y + 4, 14, '#fff7e6');
}

function drawHint(ctx, state) {
  if (state.hint.t <= 0 || !state.hint.text) return;
  const alpha = Math.min(1, state.hint.t * 2);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `bold 17px ${FONT}`;
  const width = ctx.measureText(state.hint.text).width + 30;
  panel(ctx, 640 - width / 2, 600, width, 30, state.hint.bad ? 'rgba(160,30,24,0.92)' : 'rgba(21,14,28,0.9)', state.hint.bad ? '#ff8a7a' : '#ffe27a', 15, 2);
  text(ctx, state.hint.text, 640, 621, 17, '#fff7e6');
  ctx.restore();
}

function drawPops(ctx, state) {
  for (const pop of state.pops) {
    const t = pop.age / pop.life;
    const rise = 60 * (1 - (1 - t) * (1 - t));
    const scale = t < 0.15 ? 0.6 + (t / 0.15) * 0.6 : 1.2 - Math.min(0.2, (t - 0.15) * 0.3);
    ctx.save();
    ctx.globalAlpha = t > 0.7 ? Math.max(0, 1 - (t - 0.7) / 0.3) : 1;
    ctx.font = `bold ${pop.size}px ${FONT}`;
    const half = ctx.measureText(pop.text).width * 0.6 + 8;
    ctx.translate(Math.min(1280 - half, Math.max(half, pop.x)), pop.y - rise);
    ctx.scale(scale, scale);
    ctx.lineJoin = 'round';
    ctx.font = `bold ${pop.size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(30,10,20,0.9)';
    ctx.strokeText(pop.text, 0, 0);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, 0, 0);
    ctx.restore();
  }
}

function drawBanner(ctx, state, time) {
  if (state.banner.t <= 0) return;
  const t = state.banner.t;
  const slide = Math.min(1, (3.2 - t) * 5);
  const fade = Math.min(1, t * 2);
  ctx.save();
  ctx.globalAlpha = fade;
  const y = 400 - 40 * (1 - slide);
  panel(ctx, 240, y - 40, 800, 80, 'rgba(160,20,24,0.9)', '#ffe27a', 16, 4);
  glowText(ctx, state.banner.text, 640, y + 14, 42, '#fff3c0', '#ff4a3d');
  ctx.restore();
}

function drawRushVignette(ctx, state, time) {
  if (!state.rush) return;
  const pulse = 0.5 + 0.5 * Math.sin(time * 6);
  const glow = ctx.createRadialGradient(640, 360, 360, 640, 360, 760);
  glow.addColorStop(0, 'rgba(255,40,20,0)');
  glow.addColorStop(1, `rgba(255,40,20,${0.16 + pulse * 0.16})`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1280, 720);
}

/** All HUD layers in drawing order. */
export function drawHudBelow(ctx, world, time) {
  const state = world.state;
  drawSign(ctx, time);
  drawShiftTimer(ctx, state, time);
  drawScore(ctx, state);
  drawBoard(ctx, state, time);
  drawHands(ctx, state);
  drawComboMeter(ctx, state, world);
  drawKeys(ctx);
}

export function drawHudAbove(ctx, world, time) {
  const state = world.state;
  drawRushVignette(ctx, state, time);
  drawPrompt(ctx, world);
  drawPops(ctx, state);
  drawHint(ctx, state);
  drawBanner(ctx, state, time);
}

