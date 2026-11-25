// The renderer: paints the whole 1280x720 field each frame in layers: backdrop, stations, chef,
// particles, HUD, then any full-screen overlay. The static room is painted once and blitted.
import { FIELD, LAYOUT } from './config.js';
import { drawChef, drawHeld } from './characters.js';
import { drawStations, paintBackdrop } from './kitchen.js';
import { drawHudAbove, drawHudBelow } from './hud.js';
import { drawPaused, drawSummary, drawTitle } from './screens.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function drawParticles(ctx, state) {
  for (const particle of state.particles) {
    const t = particle.age / particle.life;
    ctx.globalAlpha = (1 - t) * (particle.soft ? 0.5 : 1);
    ctx.fillStyle = particle.color;
    const size = particle.size * (particle.soft ? 1 + t * 1.4 : 1 - t * 0.4);
    if (particle.soft) {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
    }
  }
  ctx.globalAlpha = 1;
}

export function createRenderer(canvas) {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  const ctx = canvas.getContext('2d');
  const backdrop = document.createElement('canvas');
  backdrop.width = FIELD.width;
  backdrop.height = FIELD.height;
  paintBackdrop(backdrop.getContext('2d'));

  /** `view` = { screen, best, newBest, time }; `time` is a steady clock in seconds for animation. */
  function draw(world, view) {
    const state = world.state;
    const time = view.time;
    ctx.save();
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    if (state.shake > 0) ctx.translate(Math.sin(time * 120) * state.shake * 10, Math.cos(time * 97) * state.shake * 8);
    ctx.drawImage(backdrop, 0, 0);
    if (view.screen === SCREEN_TITLE) {
      ctx.restore();
      drawTitle(ctx, time, view.best);
      return;
    }
    drawStations(ctx, world, time);
    const busy = state.board.hit > 0;
    drawChef(ctx, state.chef, time, busy);
    drawHeld(ctx, state.chef, time);
    drawParticles(ctx, state);
    ctx.restore();
    ctx.fillStyle = '#120a1a';
    ctx.fillRect(0, LAYOUT.barY - 2, FIELD.width, FIELD.height - LAYOUT.barY + 2);
    drawHudBelow(ctx, world, time);
    drawHudAbove(ctx, world, time);
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255,240,180,${state.flash * 0.18})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    if (view.screen === SCREEN_PAUSED) drawPaused(ctx);
    else if (view.screen === SCREEN_OVER) drawSummary(ctx, state, view.best, view.newBest, time);
  }

  return { draw };
}
