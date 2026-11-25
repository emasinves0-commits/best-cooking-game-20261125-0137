// Keyboard and mouse. Held keys give a steering vector; one-shot presses are queued as bit flags
// and taken once per frame, so a press between two frames is never lost and never counted twice.
// Clicks are converted to the 1280x720 logical field the world works in.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;
export const ACTION_TRASH = 8;
export const ACTION_MUTE = 16;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const INTERACT = new Set(['KeyE', 'Space']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const TRASH = new Set(['KeyX', 'KeyQ']);
const MUTE = new Set(['KeyM']);

export function createInput(canvas) {
  const held = { left: false, right: false, up: false, down: false };
  let actions = 0;
  let clicks = [];
  const pointer = { x: -1, y: -1 };

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
      y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    let handled = true;
    if (LEFT.has(event.code)) held.left = true;
    else if (RIGHT.has(event.code)) held.right = true;
    else if (UP.has(event.code)) held.up = true;
    else if (DOWN.has(event.code)) held.down = true;
    else handled = false;
    if (!event.repeat) {
      if (INTERACT.has(event.code)) actions |= ACTION_INTERACT;
      if (CONFIRM.has(event.code)) actions |= ACTION_CONFIRM;
      if (PAUSE.has(event.code)) actions |= ACTION_PAUSE;
      if (TRASH.has(event.code)) actions |= ACTION_TRASH;
      if (MUTE.has(event.code)) actions |= ACTION_MUTE;
    }
    if (handled || INTERACT.has(event.code) || CONFIRM.has(event.code) || PAUSE.has(event.code) || TRASH.has(event.code) || MUTE.has(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) held.left = false;
    else if (RIGHT.has(event.code)) held.right = false;
    else if (UP.has(event.code)) held.up = false;
    else if (DOWN.has(event.code)) held.down = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    held.left = held.right = held.up = held.down = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toField(event);
    clicks.push(point);
    actions |= ACTION_CONFIRM;
  });
  canvas.addEventListener('pointermove', (event) => {
    const point = toField(event);
    pointer.x = point.x;
    pointer.y = point.y;
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.x = -1;
    pointer.y = -1;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    /** Steering as { dx, dy }, each -1, 0 or 1. */
    direction() {
      return { dx: (held.right ? 1 : 0) - (held.left ? 1 : 0), dy: (held.down ? 1 : 0) - (held.up ? 1 : 0) };
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
    pointer,
  };
}
