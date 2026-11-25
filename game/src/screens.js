// The full-screen overlays: title (menu, how to play, best score), pause, and the shift summary.
import { SCORE, SHIFT } from './config.js';
import { DISHES, ingredientOf } from './recipes.js';
import { drawDish, drawFinished } from './food.js';
import { glowText, text } from './hud.js';

function panel(ctx, x, y, w, h, fill, stroke, radius = 14, lineWidth = 3) {
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

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(10,5,18,${alpha})`;
  ctx.fillRect(0, 0, 1280, 720);
}

function glyphLine(ctx, kind, x, y) {
  // 'chop', 'cook', 'chopcook' or 'none' in words, for the menu cards
  const words = { chop: 'chop', cook: 'cook', chopcook: 'chop + cook', none: 'as is' }[kind];
  text(ctx, words, x, y, 11, kind === 'none' ? '#9a8aaa' : '#ffd27a', 'center', 'normal');
}

export function drawTitle(ctx, time, best) {
  dim(ctx, 0.72);
  const flicker = 0.92 + 0.08 * Math.sin(time * 7) * Math.sin(time * 1.7);
  ctx.save();
  ctx.globalAlpha = flicker;
  glowText(ctx, 'KILAT KITCHEN', 640, 84, 78, '#ffe0f2', '#ff4fa3');
  ctx.restore();
  text(ctx, 'warung malam  ·  a lightning-fast night-market cooking rush', 640, 118, 19, '#ffc98a');
  // the four dishes
  DISHES.forEach((dish, index) => {
    const x = 28 + index * 303;
    const y = 140;
    panel(ctx, x, y, 288, 262, 'rgba(26,14,34,0.92)', dish.color, 16, 3);
    ctx.fillStyle = dish.color;
    ctx.beginPath();
    ctx.roundRect(x, y, 288, 8, [16, 16, 0, 0]);
    ctx.fill();
    drawDish(ctx, dish, x + 144, y + (dish.id === 'teh' ? 76 : 82), dish.id === 'teh' ? 1.4 : 1.7, time);
    text(ctx, dish.local, x + 144, y + 148, 24, '#fff7e6');
    text(ctx, dish.name, x + 144, y + 168, 14, dish.color, 'center', 'normal');
    dish.components.forEach((ing, slot) => {
      const cx = x + 52 + slot * 92;
      panel(ctx, cx - 36, y + 178, 72, 74, 'rgba(255,255,255,0.07)', null, 10);
      drawFinished(ctx, ing, cx, y + 204, 0.7);
      text(ctx, ingredientOf(ing).name, cx, y + 232, 12, '#fff7e6');
      glyphLine(ctx, ingredientOf(ing).process, cx, y + 246);
    });
  });
  // how to play
  panel(ctx, 28, 418, 800, 280, 'rgba(26,14,34,0.92)', '#ffb347', 16, 3);
  text(ctx, 'HOW TO PLAY', 52, 450, 22, '#ffb347', 'left');
  const lines = [
    ['1', 'Read the order board at the top: each ticket lists its three parts and how to prepare them.'],
    ['2', 'Fetch raw parts from the PANTRY. Hands carry one thing at a time.'],
    ['3', 'CHOP at the board (3 taps) and/or COOK in a pan, but never leave a pan, it burns!'],
    ['4', 'Snap the finished parts onto the PLATING counter. Three right parts make a dish.'],
    ['5', 'Carry the plate to the SERVE window before the ticket timer runs out.'],
    ['6', 'Serve the NEXT ticket (leftmost) without mistakes to build a COMBO multiplier.'],
    ['7', 'Wrong mix? Click the red X on the plate, or press X to bin what you hold.'],
  ];
  lines.forEach(([number, line], index) => {
    const y = 482 + index * 29;
    panel(ctx, 52, y - 17, 24, 24, '#ffb347', null, 12);
    text(ctx, number, 64, y, 15, '#2a1408');
    text(ctx, line, 88, y, 15, '#fff0d8', 'left', 'normal');
  });
  // best score and start
  panel(ctx, 848, 418, 404, 130, 'rgba(26,14,34,0.92)', '#4df3ff', 16, 3);
  text(ctx, 'BEST SHIFT', 1050, 452, 18, '#9be7ff');
  text(ctx, String(best), 1050, 508, 54, '#fff7e6');
  text(ctx, `a shift lasts ${SHIFT.seconds / 60} minutes · last ${SHIFT.rushSeconds}s is RUSH HOUR`, 1050, 534, 13, '#c9b79a', 'center', 'normal');
  const pulse = 0.5 + 0.5 * Math.sin(time * 5);
  panel(ctx, 848, 562, 404, 136, `rgba(${200 + pulse * 40},${60 + pulse * 20},60,0.95)`, '#ffe27a', 16, 4);
  glowText(ctx, 'OPEN THE STALL', 1050, 616, 36, '#fff7e6', '#ffb347');
  text(ctx, 'press SPACE or click', 1050, 646, 18, '#ffe9c4');
  text(ctx, 'move: WASD / arrows or click the floor', 1050, 672, 13, '#ffd9b0', 'center', 'normal');
  text(ctx, 'use: E / Space or click a counter', 1050, 688, 13, '#ffd9b0', 'center', 'normal');
}

export function drawPaused(ctx) {
  dim(ctx, 0.6);
  panel(ctx, 420, 270, 440, 160, 'rgba(26,14,34,0.96)', '#ffb347', 16, 4);
  glowText(ctx, 'PAUSED', 640, 340, 56, '#fff7e6', '#ffb347');
  text(ctx, 'press P, Esc or click to resume', 640, 390, 18, '#c9b79a', 'center', 'normal');
}

function rating(score) {
  if (score >= 3600) return 'Warung Legend';
  if (score >= 2400) return 'Night-Market Star';
  if (score >= 1400) return 'Solid Line Cook';
  if (score >= 600) return 'Getting Warmer';
  return 'Fresh Apprentice';
}

export function drawSummary(ctx, state, best, isNewBest, time) {
  dim(ctx, 0.74);
  panel(ctx, 300, 52, 680, 624, 'rgba(26,14,34,0.97)', '#ff4fa3', 20, 4);
  glowText(ctx, 'SHIFT COMPLETE', 640, 126, 54, '#ffe0f2', '#ff4fa3');
  text(ctx, rating(state.score), 640, 164, 24, '#ffc98a');
  text(ctx, 'FINAL SCORE', 640, 214, 18, '#9be7ff');
  text(ctx, String(state.score), 640, 282, 76, '#fff7e6');
  if (isNewBest) glowText(ctx, 'NEW BEST!', 640, 322, 28, '#7dffb0', '#2fd16b');
  const rows = [
    ['Dishes served', String(state.served)],
    ['Best combo', `${state.bestCombo} in a row (x${(1 + SCORE.comboStep * Math.min(state.bestCombo, SCORE.comboCap)).toFixed(2)})`],
    ['Orders missed', String(state.missed)],
    ['Mistakes', String(state.mistakes)],
    ['Best shift', String(best)],
  ];
  rows.forEach(([label, value], index) => {
    const y = 370 + index * 36;
    ctx.fillStyle = index % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)';
    ctx.fillRect(340, y - 24, 600, 34);
    text(ctx, label, 364, y, 19, '#c9b79a', 'left', 'normal');
    text(ctx, value, 916, y, 21, '#fff7e6', 'right');
  });
  DISHES.forEach((dish, index) => {
    const x = 400 + index * 140;
    drawDish(ctx, dish, x, 580, 0.62, time);
    text(ctx, `x${state.servedByDish[dish.id]}`, x, 616, 16, dish.color);
  });
  const pulse = 0.5 + 0.5 * Math.sin(time * 5);
  text(ctx, 'press SPACE or click to cook another shift', 640, 656, 17, `rgba(255,226,122,${0.6 + pulse * 0.4})`);
}

