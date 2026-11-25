// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between four screens: title, play, paused and the shift summary.
//
// ?seed=N fixes the order sequence. ?shot=cover|rush|serve|title (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, SHIFT, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, ACTION_TRASH, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
// A handle for play-testing from a browser console or an automated run; the game itself never reads it.
window.__kilat = { world };

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world, () => createRandom(seed));
  let painted = 0;
  function paint() {
    renderer.draw(world, scene);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const audio = createAudio();
  let screen = SCREEN_TITLE;
  let best = readBest();
  let newBest = false;
  let accumulator = 0;
  let clock = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each result.
  function announce(message) {
    status.textContent = message;
  }

  function startShift() {
    world.reset();
    accumulator = 0;
    newBest = false;
    screen = SCREEN_PLAY;
    audio.play('start');
    announce(`Shift started. ${SHIFT.seconds} seconds on the clock.`);
  }

  function endShift() {
    screen = SCREEN_OVER;
    newBest = world.state.score > best;
    if (newBest) {
      best = world.state.score;
      saveBest(best);
    }
    audio.setSizzle(0);
    announce(`Shift over. Score ${world.state.score}. ${world.state.served} dishes served. Best combo ${world.state.bestCombo}. Best ${best}.`);
  }

  function togglePause() {
    if (screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.setSizzle(0);
      announce('Paused.');
    } else if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step(command) {
    const ended = world.step(STEP, command);
    for (const [name, argument] of world.state.sounds) audio.play(name, argument);
    if (world.state.hint.t > 1.55 && world.state.hint.text) announce(world.state.hint.text);
    if (ended) endShift();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    clock += dt;
    const actions = input.takeActions();
    const clicks = input.takeClicks();
    if (actions & ACTION_MUTE) audio.toggleMute();
    if (actions & (ACTION_CONFIRM | ACTION_INTERACT) || clicks.length > 0) audio.unlock();
    if (actions & ACTION_PAUSE) togglePause();
    else if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      if (actions & ACTION_CONFIRM) {
        clicks.length = 0; // the click that opens the stall is not an order to walk
        startShift();
      }
    } else if (screen === SCREEN_PAUSED) {
      if (clicks.length > 0) togglePause();
    }
    if (screen === SCREEN_PLAY) {
      accumulator += dt;
      const direction = input.direction();
      let pending = { dx: direction.dx, dy: direction.dy, interact: Boolean(actions & ACTION_INTERACT), trash: Boolean(actions & ACTION_TRASH), clicks };
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step(pending);
        pending = { dx: direction.dx, dy: direction.dy, interact: false, trash: false, clicks: [] };
        accumulator -= STEP;
      }
      audio.setSizzle(world.state.sizzle ?? 0);
    } else {
      accumulator = 0;
      if (screen === SCREEN_TITLE) world.idle(dt);
    }
    renderer.draw(world, { screen, best, newBest, time: clock });
  }

  // Leaving the tab pauses a running shift rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) togglePause();
  });

  announce('Kilat Kitchen. Press Space or click to open the stall.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
