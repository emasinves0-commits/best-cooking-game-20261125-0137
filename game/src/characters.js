// The chef (who walks, carries and chops) and the customer at the serving window.
import { dishOf, itemName } from './recipes.js';
import { drawDish, drawFood } from './food.js';

function disc(ctx, x, y, r, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
}

/** The chef, feet at (x, y): about 96 px tall with the hat. */
export function drawChef(ctx, chef, time, busy) {
  const bob = chef.moving ? Math.abs(Math.sin(chef.walk)) * 4 : Math.sin(time * 3) * 1;
  const shake = chef.shake > 0 ? Math.sin(time * 80) * 3 : 0;
  ctx.save();
  ctx.translate(chef.x + shake, chef.y);
  ctx.scale(chef.facing, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // legs
  const swing = chef.moving ? Math.sin(chef.walk) * 7 : 0;
  ctx.fillStyle = '#2b2b3a';
  ctx.fillRect(-12 + swing * 0.3, -18 - bob, 9, 20 + (swing > 0 ? 0 : -3));
  ctx.fillRect(3 - swing * 0.3, -18 - bob, 9, 20 + (swing < 0 ? 0 : -3));
  disc(ctx, -8 + swing * 0.3, 1, 6, '#1a1a24');
  disc(ctx, 8 - swing * 0.3, 1, 6, '#1a1a24');
  // body: white jacket, red apron
  ctx.translate(0, -bob);
  ctx.beginPath();
  ctx.roundRect(-20, -62, 40, 48, 12);
  ctx.fillStyle = '#fff8ec';
  ctx.fill();
  ctx.strokeStyle = '#cfc4ae';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-14, -50, 28, 36, 8);
  ctx.fillStyle = '#d93a2b';
  ctx.fill();
  ctx.fillStyle = '#ffd24a';
  ctx.fillRect(-14, -42, 28, 3);
  // arms
  const armLift = busy ? Math.sin(time * 30) * 5 : swing * 0.5;
  ctx.fillStyle = '#fff8ec';
  ctx.strokeStyle = '#cfc4ae';
  ctx.beginPath();
  ctx.roundRect(-27, -56 + armLift * 0.3, 10, 26, 5);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(17, -56 - armLift * 0.3, 10, 26, 5);
  ctx.fill();
  ctx.stroke();
  disc(ctx, -22, -29 + armLift * 0.3, 5, '#f2b98a');
  disc(ctx, 22, -29 - armLift * 0.3, 5, '#f2b98a');
  // head
  disc(ctx, 0, -72, 15, '#f4bf91', '#c48a5e');
  disc(ctx, 6, -71, 2.1, '#2a1a12');
  disc(ctx, -5, -71, 2.1, '#2a1a12');
  ctx.strokeStyle = '#a5503a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0.5, -66, 5, 0.2, Math.PI - 0.2);
  ctx.stroke();
  disc(ctx, -10, -66, 3, 'rgba(255,120,110,0.45)');
  disc(ctx, 11, -66, 3, 'rgba(255,120,110,0.45)');
  // toque
  ctx.beginPath();
  ctx.roundRect(-14, -90, 28, 9, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#cfc4ae';
  ctx.stroke();
  disc(ctx, -9, -97, 9, '#ffffff', '#cfc4ae');
  disc(ctx, 0, -101, 10, '#ffffff', '#cfc4ae');
  disc(ctx, 9, -97, 9, '#ffffff', '#cfc4ae');
  ctx.restore();
}

/** What the chef is holding, drawn in a bubble beside them so it reads at a glance. */
export function drawHeld(ctx, chef, time) {
  const held = chef.held;
  if (!held) return;
  const x = chef.x + chef.facing * 38;
  const y = chef.y - 74 + Math.sin(time * 4) * 2;
  ctx.save();
  ctx.fillStyle = 'rgba(21,14,28,0.78)';
  ctx.strokeStyle = '#ffe27a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 30, y - 28, 60, 52, 12);
  ctx.fill();
  ctx.stroke();
  if (held.kind === 'plate') drawDish(ctx, dishOf(held.dish), x, y + 2, 0.55, time);
  else drawFood(ctx, held.item.ing, held.item, x, y - 2, 1.0);
  ctx.restore();
}

export function heldLabel(held) {
  if (!held) return 'Empty hands';
  if (held.kind === 'plate') return `${dishOf(held.dish).local}: serve it!`;
  return itemName(held.item);
}

/** The customer at the serving window; `mood` 0 waiting, 1 happy (just served). */
export function drawCustomer(ctx, x, y, mood, time, order) {
  const sway = Math.sin(time * 2 + x) * 2;
  ctx.save();
  ctx.translate(x + sway, y);
  ctx.beginPath();
  ctx.ellipse(0, 6, 34, 26, 0, Math.PI, 0);
  ctx.fillStyle = mood ? '#3b8f6a' : '#4a6fb0';
  ctx.fill();
  disc(ctx, 0, -20, 15, '#e7ab7b', '#b87a50');
  ctx.beginPath();
  ctx.arc(0, -25, 16, Math.PI, 0);
  ctx.fillStyle = '#2a1a22';
  ctx.fill();
  disc(ctx, -5, -20, 2, '#2a1a12');
  disc(ctx, 5, -20, 2, '#2a1a12');
  ctx.strokeStyle = '#7a3028';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (mood) ctx.arc(0, -14, 6, 0.1, Math.PI - 0.1);
  else ctx.arc(0, -9, 5, Math.PI + 0.3, -0.3);
  ctx.stroke();
  if (order) {
    ctx.fillStyle = '#fff4d6';
    ctx.beginPath();
    ctx.roundRect(24, -62, 46, 26, 8);
    ctx.fill();
    ctx.fillStyle = dishOf(order).color;
    ctx.fillRect(28, -58, 38, 5);
    ctx.fillStyle = '#2a1a22';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dishOf(order).local.split(' ')[0], 47, -40);
  }
  ctx.restore();
}
